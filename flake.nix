{
  description = "joshbooks, an accounting/budgeting app";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      pkgs = import nixpkgs { system = "x86_64-linux"; };
    in
    {
      packages.x86_64-linux.default = import nix/package.nix {
        inherit pkgs;
      };

      devShells.x86_64-linux.default = import nix/devShell.nix {
        inherit self pkgs;
      };

      nixosModules.default = import nix/module.nix {
        inherit self;
      };
    };
}
