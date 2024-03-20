import { ModCallbackCustom, getPlayers  } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";
import { COSTUME_PARIKU_HAIR, COSTUME_PARIKU_HAIR_B, PARIKU_TYPE, TAINTED_PARIKU_TYPE } from "./constants";
import { CacheFlag, ModCallback } from "isaac-typescript-definitions";

function addHair(player: EntityPlayer) {
    player.TryRemoveNullCostume(COSTUME_PARIKU_HAIR);
    player.TryRemoveNullCostume(COSTUME_PARIKU_HAIR_B);
    if (player.GetPlayerType() === PARIKU_TYPE) {
        player.AddNullCostume(COSTUME_PARIKU_HAIR);
    } else if (player.GetPlayerType() === TAINTED_PARIKU_TYPE) {
        player.AddNullCostume(COSTUME_PARIKU_HAIR_B);
    }
}

function gameStart() {
    for (const player of getPlayers(false)) {
        if (player.GetPlayerType() === PARIKU_TYPE || player.GetPlayerType() === TAINTED_PARIKU_TYPE) {
            player.AddCacheFlags(CacheFlag.ALL);
            player.EvaluateItems();
        }
    }
}

function fixHair() {
    for (const player of getPlayers(false)) {
        addHair(player);
    }
}

export function init(mod: ModUpgraded): void {
    mod.AddCallback(ModCallback.POST_PLAYER_INIT, addHair);
    mod.AddCallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED, fixHair);
    mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED_LAST, gameStart, false);
}