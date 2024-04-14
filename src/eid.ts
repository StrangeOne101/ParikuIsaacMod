import { getPlayersOfType  } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";
import { PARIKU_TYPE, TAINTED_PARIKU_TYPE } from "./constants";

export function init(mod: ModUpgraded): void {

    if (!EID) {
        return;
    }

    const parikuIcon = Sprite()
    parikuIcon.Load("gfx/pariku_icon.anm2", true)
    EID.addIcon(`Player${  PARIKU_TYPE}`, "Icon", 1, 16, 16, 5, 7,  parikuIcon);

    // Adds the birthright description for Pariku
    EID.addBirthright(PARIKU_TYPE, "{{Charm}} 10% chance to shoot charm tears#{{Collectible163}} Items that grant familiars are 2x more likely to appear");

    // Adds the description for dice rooms when using Pariku
    EID.addDescriptionModifier("ParikuDiceroom", (desc: EIDDescriptionObject) => {
        if (getPlayersOfType(PARIKU_TYPE).length === 0) {return false;}

        if (desc.fullItemString === "1000.76.1" || desc.fullItemString === "1000.76.6") { // Dice rooms of 1 and 6 dots
            return true;
        }
        return false;
    }, (desc: EIDDescriptionObject) => { // Adds the description for Pari rerolling stats in dice rooms
        desc.Description += `#{{Player${  PARIKU_TYPE  }}} {{ColorGray}}Pariku#Rerolls all stat buffs caused from soul hearts`;
        return desc;
    });

    Isaac.DebugString("EID Stuff for Pariku Registered");
}