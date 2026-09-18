pub mod folder_diff;
pub mod text_diff;

pub use folder_diff::compare_file_lists;
pub use text_diff::compute_file_diff;
