import { getPlayersOfType, getRandom } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";
import { PARIKU_TYPE } from "./constants";
import { CollectibleType, EntityType, ItemType, ModCallback, TearFlag  } from "isaac-typescript-definitions";
import type {ItemPoolType} from "isaac-typescript-definitions";

export function init(mod: ModUpgraded): void {
   mod.AddCallback(ModCallback.POST_FIRE_TEAR, onTearFire);
   mod.AddCallback(ModCallback.POST_GET_COLLECTIBLE, onCollectionSelectItem);
}

const game = Game();
let reselectItem = false;

function onTearFire(tear: EntityTear) {
    const parent = tear.Parent;

    if (parent === undefined || parent.Type !== EntityType.PLAYER) {
        Isaac.DebugString("Parent is not a player");
        return;
    }

    const player = parent.ToPlayer();
    if (player === undefined) {
        Isaac.DebugString("Player is null");
        return;
    }

    // Only work for Pariku when she has birthright.
    if (player.GetPlayerType() !== PARIKU_TYPE || !player.HasCollectible(CollectibleType.BIRTHRIGHT)) {
        return;
    }

    const chance:float = 1 / (10 - (player.Luck / 3));

    if (getRandom(undefined) <= chance) {
        tear.AddTearFlags(TearFlag.CHARM); // Add the charm flag to the tear
        tear.SetColor(Color(1, 0, 1, 1, 0.196, 0, 0), -1, 0, false); // Set the color to pink
    }
}

function onCollectionSelectItem(item: CollectibleType, pool: ItemPoolType, decrease: boolean, seed: Seed) {
    // Isaac.DebugString(`Select item ${ item}`);.
    if (reselectItem) { // We are already reselecting an item from the code bellow, so this prevents an infinite loop
        reselectItem = false;
        return item;
    }

    // Only work for Pariku when she has birthright.
    for (const player of getPlayersOfType(PARIKU_TYPE)) {
        if (player.HasCollectible(CollectibleType.BIRTHRIGHT)) {
            // Isaac.DebugString("Reselecting item for Pariku");.
            const itemConfig = Isaac.GetItemConfig().GetCollectible(item);
            if (itemConfig?.Type !== ItemType.FAMILIAR) {
                const newSeed = seed & 1337;
                reselectItem = true; // Prevent infinite loop
                const newItem = game.GetItemPool().GetCollectible(pool, decrease, newSeed as Seed);
                // Isaac.DebugString(`Reselected item: ${newItem}`);
                return newItem;
            }
        }
    }

    return item;
}