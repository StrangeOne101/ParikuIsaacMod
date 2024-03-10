import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import type { ModUpgraded} from "isaacscript-common";
import { getRandomFromWeightedArray, PlayerStat,  ModCallbackCustom ,HealthType} from "isaacscript-common";
import { PARIKU_TYPE } from "./constants";

/** Modifies the stats of the player based on the player stat passed to the array. */
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => {  },
    // Tear color

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => {  },
    // Flight
    (player: EntityPlayer, value: number, _multiply: boolean) => { player.CanFly = (value % 2 === 1) },
    // Luck
    (player: EntityPlayer, value: number, multiply: boolean) => { player.Luck = (multiply ? player.Luck * value : player.Luck + value) },
    // Size

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => {  },
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
        return s === this.stat as number || s === CacheFlag.ALL;
    }

    Apply(player: EntityPlayer): void {
        ModifyStats[this.stat].call(this, player, this.amount, this.multiply);
    }

    ToString():string {
        return `[${  PlayerStat[this.stat]  },${ this.multiply ? "x" : "+"}${  this.amount  }]`;
    }


}

const cacheFlagToPlayerStat: number[] = [];
cacheFlagToPlayerStat[CacheFlag.DAMAGE] = PlayerStat.DAMAGE;
cacheFlagToPlayerStat[CacheFlag.FIRE_DELAY] = PlayerStat.FIRE_DELAY;
cacheFlagToPlayerStat[CacheFlag.SHOT_SPEED] = PlayerStat.SHOT_SPEED;
cacheFlagToPlayerStat[CacheFlag.RANGE] = PlayerStat.TEAR_RANGE;
cacheFlagToPlayerStat[CacheFlag.SPEED] = PlayerStat.MOVE_SPEED;
cacheFlagToPlayerStat[CacheFlag.FLYING] = PlayerStat.FLYING;
cacheFlagToPlayerStat[CacheFlag.LUCK] = PlayerStat.LUCK;
cacheFlagToPlayerStat[CacheFlag.SIZE] = PlayerStat.SIZE;

const statExtensions = Array.from({length: 13})


export function init(mod: ModUpgraded): void {
    // mod.AddCallbackCustom(ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED, update);
    mod.AddCallbackCustom(ModCallbackCustom.POST_PLAYER_CHANGE_HEALTH, updateHealth)
    mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, (_) => { initStats(); }, undefined);
    mod.AddCallback(ModCallback.EVALUATE_CACHE, evaluateCache);
}

function initStats() {
    Isaac.DebugString("StatTracker initStats called");
    const one: Array<[StatOption, float]> = [ // One heart
        [new StatOption(PlayerStat.TEAR_RANGE, 1.2 * 40), 10], // Stat, weight. *40 for range since tiles are 40 pixels
        [new StatOption(PlayerStat.MOVE_SPEED, 0.3), 15],
    ];
    const two: Array<[StatOption, float]> = [ // Two hearts
        [new StatOption(PlayerStat.TEAR_RANGE, 2.4 * 40), 8], // Stat, weight
        [new StatOption(PlayerStat.MOVE_SPEED, 0.5), 12],
        [new StatOption(PlayerStat.LUCK, 1), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
    ];
    const three: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 2.4 * 40), 8], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.15), 10],
    ];
    const four: Array<[StatOption, float]> = [ // Two are chosen at 4
        [new StatOption(PlayerStat.TEAR_RANGE, 2 * 40), 8], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.9), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.2), 10],
        [new StatOption(PlayerStat.LUCK, 2.5), 6],
    ];
    const five: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 1.5 * 40), 6], // Stat, weight
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.2), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.5), 8],
    ];
    const six: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.DAMAGE, 1.8, true), 15], // Multiplier
        [new StatOption(PlayerStat.FIRE_DELAY, -0.8), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, 0.75, true), 10],
        [new StatOption(PlayerStat.LUCK, 4), 3],
    ];
    const seven: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.DAMAGE, 2.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.5), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 4.5 * 40), 8],
        [new StatOption(PlayerStat.LUCK, 3), 10],
    ];
    const eight: Array<[StatOption, float]> = [ // Two are chosen
        [new StatOption(PlayerStat.DAMAGE, 2.5), 15],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.4), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, 0.75, true), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 3.5 * 40), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.1, true), 15],
    ];

    const seeds: Seeds = Game().GetSeeds();

    statExtensions[0] = getRandomFromWeightedArray(one, seeds.GetNextSeed());
    statExtensions[1] = getRandomFromWeightedArray(two, seeds.GetNextSeed());
    statExtensions[2] = getRandomFromWeightedArray(three, seeds.GetNextSeed());
    statExtensions[3] = getRandomFromWeightedArray(four, seeds.GetNextSeed());
    statExtensions[4] = getRandomFromWeightedArray(five, seeds.GetNextSeed());
    statExtensions[5] = getRandomFromWeightedArray(six, seeds.GetNextSeed());
    statExtensions[6] = getRandomFromWeightedArray(seven, seeds.GetNextSeed());
    statExtensions[7] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    // The following are for testing and are not final.
    statExtensions[8] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[9] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[10] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[11] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[12] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    for (const o of statExtensions) {
        const stat = o as StatOption;

        Isaac.DebugString(`Registered stat change of ${  stat.ToString()}`);
    }

}



/* function update(player: EntityPlayer) {
    const blue = player.GetSoulHearts();

    if (blue !== parikuModStorage.bluehearts) {
        Isaac.DebugString("StatTracker health diff called ");
        updateHealth(player);
    }

    parikuModStorage.bluehearts = blue;
}*/

export function updateHealth(player: EntityPlayer, type: HealthType, _diff: int): void {
    // TODO
    if (player.GetPlayerType() !== PARIKU_TYPE) {
        return;
    }

    if (type === HealthType.SOUL || type === HealthType.BLACK) {

        player.AddCacheFlags(CacheFlag.ALL);
        player.EvaluateItems();
    }

}

function evaluateCache(player: EntityPlayer, flag: CacheFlag) {

    if (player.GetPlayerType() !== PARIKU_TYPE) {
        return;
    }


    const currentHealth = player.GetSoulHearts();
    const half: int = Math.floor((currentHealth + 1) / 2);
    const convertedFlag = cacheFlagToPlayerStat[flag];

    if (convertedFlag === undefined) { // Means it isn't a stat we should be checking for
        return;
    }

    const flagname = PlayerStat[convertedFlag];

    for (let i = 0; i < half; i++) {
        Isaac.DebugString(`Loop at ${  i} and half is at ${half}`);


        if (statExtensions[i] === undefined) {
            Isaac.DebugString(`Could not find stat lookup at index${  i}`);
            continue;
        }

        const stat = statExtensions[i] as StatOption;
        Isaac.DebugString(`Checking stat ${  stat.ToString()} with the flag being ${flagname} (${convertedFlag})`);

        if (stat.DoesApply(convertedFlag)) {
            stat.Apply(player);
            Isaac.DebugString(`Increased stat for type ${  convertedFlag }`);

        }
    }
}

