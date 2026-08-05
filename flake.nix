{
  description = "joshbooks, an accounting/budgeting app";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }: {
    packages.x86_64-linux.hello = nixpkgs.legacyPackages.x86_64-linux.hello;
    packages.x86_64-linux.default = self.packages.x86_64-linux.hello;
    devShells.x86_64-linux.default =
      let
        pkgs = import nixpkgs {
          system = "x86_64-linux";
        };
      in
      pkgs.mkShell {
        name = "joshbooks";
        buildInputs = with pkgs; [ nodejs_24 ];
        packages = with pkgs; [
          typescript-language-server
          eslint_d
        ];
      };
  };
}
