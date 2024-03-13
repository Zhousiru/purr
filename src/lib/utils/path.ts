export function getFilename(path: string) {
  return path.split(/\/|\\/).pop()!
}

export function joinPath(...paths: string[]) {
  return paths.join('/')
}
