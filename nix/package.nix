{ pkgs }:
let
  package_json = builtins.fromJSON (builtins.readFile ../package.json);
in
pkgs.buildNpmPackage {
  pname = package_json.name;
  version = package_json.version;
  src = pkgs.lib.cleanSource ../.;
  npmDepsHash = "sha256-qFYyxmvFMBZC/UbaR5uSH+QmmoGG2JsL7Dm5Z80YEcU=";
}
