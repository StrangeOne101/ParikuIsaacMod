import { name } from "../package.json";
import { upgradeMod, ISCFeature } from "isaacscript-common";
import * as statTracker from "./stat_tracker";
import * as costumes from "./costumes";
import * as birthright from "./birthright";
import * as eidextension from "./eid";
import { PARIKU_TYPE } from "./constants";
import { CacheFlag } from "isaac-typescript-definitions";


// This function is run when your mod first initializes.
export function main(): void {
    // Register the mod object, and then register the upgraded mod object from IsaacScript.
    const modVanilla = RegisterMod(name, 1);

    const features = [ISCFeature.CHARACTER_STATS] as const;
    const mod = upgradeMod(modVanilla, features);

    // Initialize our mod callbacks in the different components of this mod.
    Isaac.DebugString("Initializing Pariku Costumes...")
    costumes.init(mod);
    Isaac.DebugString("Initializing Pariku Stat Tracker...")
    statTracker.init(mod);
    Isaac.DebugString("Initializing Pariku Birthright...")
    birthright.init(mod);

    eidextension.init(mod);


    const parikuDefaultStats = new Map<CacheFlag, number>([
        [CacheFlag.DAMAGE, 3],
        [CacheFlag.SPEED, 0.9],
        [CacheFlag.RANGE, 5 * 40]
      ]);
    mod.registerCharacterStats(PARIKU_TYPE, parikuDefaultStats);

    // Print a message to the "log.txt" file.
    Isaac.DebugString(`${name} initialized.`);
}
