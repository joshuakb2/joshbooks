{ self, pkgs }:

pkgs.mkShell {
  name = "joshbooks";
  inputsFrom = with self.packages.x86_64-linux; [ default ];
  packages = with pkgs; [
    eslint_d
    postgresql
    typescript-language-server
    vscode-langservers-extracted
  ];
}
