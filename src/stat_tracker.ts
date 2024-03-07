import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import { getRandomFromWeightedArray, nextSeed, PlayerStat,  ModCallbackCustom } from "isaacscript-common";
import type {ModUpgraded} from "isaacscript-common";

/** Modifies the stats of the player based on the player stat passed to the array */
const ModifyStats = [ // Array index is PlayerStat (int)
    // Damage
    (player: EntityPlayer, value: number, multiply: boolean) => { player.Damage = (multiply ? player.Damage * value : player.Damage + value) },
    // Fire Delay
    (player: EntityPlayer, value: number, multiply: boolean) => { player.MaxFireDelay = (multiply ? player.MaxFireDelay * value : player.MaxFireDelay + value) },
    // Shot Speed
    (player: EntityPlayer, value: number, multiply: boolean) => { player.ShotSpeed = (multiply ? player.ShotSpeed * value : player.ShotSpeed + value) },
    // Tear Height
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearHeight = (multiply ? player.TearHeight * value : player.TearHeight + value) },
    // Range
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearRange = (multiply ? player.TearRange * value : player.TearRange + value) },
    // Tear falling acc
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearFallingAcceleration = (multiply ? player.TearFallingAcceleration * value : player.TearFallingAcceleration + value) },
    // Tear fall speed
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearFallingSpeed = (multiply ? player.TearFallingSpeed * value : player.TearFallingSpeed + value) },
    // Speed
    (player: EntityPlayer, value: number, multiply: boolean) => { player.MoveSpeed = (multiply ? player.MoveSpeed * value : player.MoveSpeed + value) },
    // Tear flags
    (player: EntityPlayer, value: number, multiply: boolean) => {  },
    // Tear color
    (player: EntityPlayer, value: number, multiply: boolean) => {  },
    // Flight
    (player: EntityPlayer, value: number, multiply: boolean) => { player.CanFly = (value % 2 === 1) },
    // Luck
    (player: EntityPlayer, value: number, multiply: boolean) => { player.Luck = (multiply ? player.Luck * value : player.Luck + value) },
    // Size
    (player: EntityPlayer, value: number, multiply: boolean) => {  },
] as const

class StatOption {
    stat: PlayerStat;
    amount: number;
    multiply = false;

    constructor(stat: PlayerStat, amount: number, multiply?: boolean) {
        this.stat = stat;
        this.amount = amount;

        if (multiply !== undefined) {
            this.multiply = multiply;
        }
    }

    DoesApply(s: number): boolean {
        return s === this.stat || s === CacheFlag.ALL || s === 1024;
    }

    Apply(player: EntityPlayer): void {
        ModifyStats[this.stat].call(this, player, this.amount, this.multiply);
    }

    ToString():string {
        return `[${  PlayerStat[this.stat]  },${ this.multiply ? "x" : "+"}${  this.amount  }]`;
    }


}

const parikuModStorage = {
    bluehearts: 0,
    blackhearts: 0,
    statExtensions: Array.from({length: 13})
};



export function init(mod: ModUpgraded): void {
    mod.AddCallbackCustom(ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED, update);
    mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, (_) => { initStats(); }, undefined);
    mod.AddCallback(ModCallback.EVALUATE_CACHE, evaluateCache);
}

function initStats() {
    Isaac.DebugString("StatTracker initStats called");
    const one: Array<[StatOption, float]> = [ // One heart
        [new StatOption(PlayerStat.TEAR_RANGE, 0.8), 10], // Stat, weight
        [new StatOption(PlayerStat.MOVE_SPEED, 0.3), 15],
    ];
    const two: Array<[StatOption, float]> = [ // Two hearts
        [new StatOption(PlayerStat.TEAR_RANGE, 1.5), 8], // Stat, weight
        [new StatOption(PlayerStat.MOVE_SPEED, 0.5), 12],
        [new StatOption(PlayerStat.LUCK, 1), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
    ];
    const three: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 1), 8], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.5), 10],
    ];
    const four: Array<[StatOption, float]> = [ // Two are chosen at 4
        [new StatOption(PlayerStat.TEAR_RANGE, 1.8), 8], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.9), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 1.5), 10],
        [new StatOption(PlayerStat.LUCK, 2.5), 6],
    ];
    const five: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 1.5), 6], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.5), 8],
    ];
    const six: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.DAMAGE, 1.2, true), 15], // Multiplier
        [new StatOption(PlayerStat.SHOT_SPEED, 1.5, true), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.8), 10],
    ];
    const seven: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.DAMAGE, 1.4), 8], // Multiplier
        [new StatOption(PlayerStat.SHOT_SPEED, 1.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.2), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 3.5), 8],
        [new StatOption(PlayerStat.LUCK, 3), 10],
    ];
    const eight: Array<[StatOption, float]> = [ // Two are chosen
        [new StatOption(PlayerStat.DAMAGE, 1.9), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 1.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.4), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 3.5), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.1, true), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 1.3, true), 10],
    ];

    const seeds: Seeds = Game().GetSeeds();

    parikuModStorage.statExtensions[0] = getRandomFromWeightedArray(one, seeds.GetNextSeed());
    parikuModStorage.statExtensions[1] = getRandomFromWeightedArray(two, seeds.GetNextSeed());
    parikuModStorage.statExtensions[2] = getRandomFromWeightedArray(three, seeds.GetNextSeed());
    parikuModStorage.statExtensions[3] = getRandomFromWeightedArray(four, seeds.GetNextSeed());
    parikuModStorage.statExtensions[4] = getRandomFromWeightedArray(five, seeds.GetNextSeed());
    parikuModStorage.statExtensions[5] = getRandomFromWeightedArray(six, seeds.GetNextSeed());
    parikuModStorage.statExtensions[6] = getRandomFromWeightedArray(seven, seeds.GetNextSeed());
    parikuModStorage.statExtensions[7] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    // The following are for testing and are not final.
    parikuModStorage.statExtensions[8] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    parikuModStorage.statExtensions[9] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    parikuModStorage.statExtensions[10] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    parikuModStorage.statExtensions[11] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    parikuModStorage.statExtensions[12] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    for (let o of parikuModStorage.statExtensions) {
        let stat = o as StatOption;

        Isaac.DebugString(`Registered stat change of ${  stat.ToString()}`);
    }

}



function update(player: EntityPlayer) {
    const blue = player.GetSoulHearts();

    if (blue !== parikuModStorage.bluehearts) {
        Isaac.DebugString("StatTracker health diff called ");
        updateHealth(player);
    }

    parikuModStorage.bluehearts = blue;
}

function updateHealth(player: EntityPlayer) {
    // TODO

    Isaac.DebugString("Updating health");

    player.AddCacheFlags(CacheFlag.ALL);
    player.EvaluateItems();



}

function evaluateCache(player: EntityPlayer, flag: CacheFlag) {
    const currentHealth = player.GetBlackHearts() + player.GetSoulHearts();
    const half: int = Math.floor((currentHealth + 1) / 2);
    const flagname = PlayerStat[flag];

    for (let i = 0; i < half; i++) {
        Isaac.DebugString(`Loop at ${  i} and half is at ${half}`);


        if (parikuModStorage.statExtensions[i] === undefined) {
            Isaac.DebugString(`Could not find stat lookup at index${  i}`);
            continue;
        }

        const stat = parikuModStorage.statExtensions[i] as StatOption;
        Isaac.DebugString(`Checking stat ${  stat.ToString()} with the flag being ${flagname} (${flag})`);

        if (stat.DoesApply(flag)) {
            stat.Apply(player);
            Isaac.DebugString(`Increased stat for type ${  flag}`);
        }
    }
}

