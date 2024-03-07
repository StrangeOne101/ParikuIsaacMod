import { name } from "../package.json";
import { upgradeMod  } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";
import * as statTracker from "./stat_tracker";
import * as costumes from "./costumes";


// This function is run when your mod first initializes.
export function main(): void {
    // Register the mod object, and then register the upgraded mod object from IsaacScript.
    const modVanilla = RegisterMod(name, 1);
    const mod: ModUpgraded = upgradeMod(modVanilla);

    // Initialize our mod callbacks in the different components of this mod.
    Isaac.DebugString("Initializing Pariku Costumes...")
    costumes.init(mod);
    Isaac.DebugString("Initializing Pariku Stat Tracker...")
    statTracker.init(mod);

    // Print a message to the "log.txt" file.
    Isaac.DebugString(`${name} initialized.`);
}
