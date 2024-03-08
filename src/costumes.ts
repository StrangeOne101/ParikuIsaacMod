import { ModCallbackCustom, getPlayers  } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";
import { COSTUME_PARIKU_HAIR, PARIKU_TYPE } from "./constants";
import { CacheFlag, ModCallback } from "isaac-typescript-definitions";

function addHair(player: EntityPlayer) {
  player.TryRemoveNullCostume(COSTUME_PARIKU_HAIR);
  if (player.GetPlayerType() === PARIKU_TYPE) {
      player.AddNullCostume(COSTUME_PARIKU_HAIR);
  }
}

function gameStart() {
    for (const player of getPlayers(false)) {
        if (player.GetPlayerType() === PARIKU_TYPE) {
            player.AddSoulHearts(2); // 1 heart
            player.AddCacheFlags(CacheFlag.ALL);
            player.EvaluateItems();
        }
    }
}

export function init(mod: ModUpgraded): void {
    mod.AddCallback(ModCallback.POST_PLAYER_INIT, addHair);
    mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED_LAST, gameStart, false);
}