{ self }:
{ config, pkgs, lib, ... }:
let
  cfg = config.services.joshbooks;
in
{
  options.services.joshbooks = {
    enable = lib.mkEnableOption "joshbooks";

    env = lib.mkOption {
      type = lib.types.path;
      description = "Path to the env file containing secrets for the server";
    };

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
      description = "The joshbooks server package to run";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.joshbooks = {
      enable = true;
      description = "joshbooks web server";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      serviceConfig = {
        Type = "simple";
        ExecStart = "${cfg.package}/bin/joshbooks";
        Restart = "on-failure";
        EnvironmentFile = cfg.env;
      };
    };
  };
}
