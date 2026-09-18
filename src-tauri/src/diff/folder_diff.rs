use std::collections::BTreeMap;
use crate::models::{ComparisonRow, CompareResult, DiffStatus, FileItem};

pub fn compare_file_lists(
    left_items: Vec<FileItem>,
    right_items: Vec<FileItem>,
) -> CompareResult {
    let mut map: BTreeMap<String, (Option<FileItem>, Option<FileItem>)> = BTreeMap::new();

    for item in left_items {
        let key = item.relative_path.clone();
        map.entry(key)
            .or_insert((None, None))
            .0 = Some(item);
    }

    for item in right_items {
        let key = item.relative_path.clone();
        map.entry(key)
            .or_insert((None, None))
            .1 = Some(item);
    }

    let mut rows = Vec::new();
    let mut total_left = 0;
    let mut total_right = 0;
    let mut diff_count = 0;
    let mut same_count = 0;
    let mut left_only_count = 0;
    let mut right_only_count = 0;

    for (rel_path, (left_opt, right_opt)) in map {
        let is_dir = left_opt.as_ref().map(|i| i.is_dir).unwrap_or_else(|| right_opt.as_ref().map(|i| i.is_dir).unwrap_or(false));
        let name = left_opt.as_ref().map(|i| i.name.clone()).unwrap_or_else(|| right_opt.as_ref().map(|i| i.name.clone()).unwrap_or_default());

        let status = match (&left_opt, &right_opt) {
            (Some(_), None) => {
                total_left += 1;
                left_only_count += 1;
                DiffStatus::LeftOnly
            },
            (None, Some(_)) => {
                total_right += 1;
                right_only_count += 1;
                DiffStatus::RightOnly
            },
            (Some(left), Some(right)) => {
                total_left += 1;
                total_right += 1;

                if left.is_dir && right.is_dir {
                    DiffStatus::Same
                } else if left.is_dir != right.is_dir {
                    diff_count += 1;
                    DiffStatus::Different
                } else {
                    // Cả 2 đều là file
                    let size_match = left.size == right.size;
                    let mtime_diff = (left.mtime - right.mtime).abs();
                    let hash_match = match (&left.hash, &right.hash) {
                        (Some(h1), Some(h2)) => Some(h1 == h2),
                        _ => None,
                    };

                    if let Some(matches) = hash_match {
                        if matches {
                            same_count += 1;
                            DiffStatus::Same
                        } else {
                            diff_count += 1;
                            if left.mtime > right.mtime {
                                DiffStatus::LeftNewer
                            } else if right.mtime > left.mtime {
                                DiffStatus::RightNewer
                            } else {
                                DiffStatus::Different
                            }
                        }
                    } else if size_match && mtime_diff <= 2 {
                        same_count += 1;
                        DiffStatus::Same
                    } else {
                        diff_count += 1;
                        if left.mtime > right.mtime {
                            DiffStatus::LeftNewer
                        } else if right.mtime > left.mtime {
                            DiffStatus::RightNewer
                        } else {
                            DiffStatus::Different
                        }
                    }
                }
            },
            (None, None) => unreachable!(),
        };

        rows.push(ComparisonRow {
            relative_path: rel_path,
            name,
            is_dir,
            left_item: left_opt,
            right_item: right_opt,
            status,
        });
    }

    CompareResult {
        rows,
        total_left,
        total_right,
        diff_count,
        same_count,
        left_only_count,
        right_only_count,
    }
}
