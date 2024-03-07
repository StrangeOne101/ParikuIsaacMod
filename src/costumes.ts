import type { ModUpgraded } from "isaacscript-common";
import { COSTUME_PARIKU_HAIR, PARIKU_TYPE } from "./constants";
import { ModCallback } from "isaac-typescript-definitions";

function addHair(player: EntityPlayer) {
  player.TryRemoveNullCostume(COSTUME_PARIKU_HAIR);
  if (player.GetPlayerType() === PARIKU_TYPE) {
      player.AddNullCostume(COSTUME_PARIKU_HAIR);
  }
}

export function init(mod: ModUpgraded): void {
    mod.AddCallback(ModCallback.POST_PLAYER_INIT, addHair);
}