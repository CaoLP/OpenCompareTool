use similar::{ChangeTag, TextDiff};
use crate::models::{FileContentDiff, TextDiffHunk};

pub fn compute_file_diff(
    left_path: &str,
    right_path: &str,
    left_content: &str,
    right_content: &str,
) -> FileContentDiff {
    let diff = TextDiff::from_lines(left_content, right_content);
    let mut hunks = Vec::new();

    let mut left_line_idx = 1;
    let mut right_line_idx = 1;

    for change in diff.iter_all_changes() {
        let tag = change.tag();
        let value = change.value().trim_end_matches(['\r', '\n']).to_string();

        let (change_type, left_lines, right_lines, left_start, right_start) = match tag {
            ChangeTag::Equal => {
                let start_l = left_line_idx;
                let start_r = right_line_idx;
                left_line_idx += 1;
                right_line_idx += 1;
                ("equal".to_string(), vec![value.clone()], vec![value], start_l, start_r)
            },
            ChangeTag::Delete => {
                let start_l = left_line_idx;
                left_line_idx += 1;
                ("delete".to_string(), vec![value], vec![], start_l, right_line_idx)
            },
            ChangeTag::Insert => {
                let start_r = right_line_idx;
                right_line_idx += 1;
                ("insert".to_string(), vec![], vec![value], left_line_idx, start_r)
            },
        };

        hunks.push(TextDiffHunk {
            change_type,
            left_lines,
            right_lines,
            left_start,
            right_start,
        });
    }

    FileContentDiff {
        left_path: left_path.to_string(),
        right_path: right_path.to_string(),
        left_content: left_content.to_string(),
        right_content: right_content.to_string(),
        hunks,
        is_binary: false,
    }
}
