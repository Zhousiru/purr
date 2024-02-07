use std::{fs::read_dir, io, os::windows::fs::MetadataExt, path::Path};

pub fn dir_size<P: AsRef<Path>>(path: P) -> io::Result<u64> {
  let entries = read_dir(path)?;
  let mut total_size = 0;

  for entry in entries {
    let entry = entry?;
    let metadata = entry.metadata()?;

    if metadata.is_dir() {
      total_size += dir_size(entry.path())?
    } else {
      total_size += metadata.file_size()
    }
  }

  Ok(total_size)
}
