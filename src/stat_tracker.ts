/* eslint-disable max-classes-per-file */
import { CacheFlag, DiceFloorSubType, ModCallback } from "isaac-typescript-definitions";
import type { ModUpgraded } from "isaacscript-common";
import { getRandomFromWeightedArray, PlayerStat, ModCallbackCustom, HealthType } from "isaacscript-common";
import { COSTUME_PARIKU_HAIR, PARIKU_TYPE, TAINTED_PARIKU_TYPE } from "./constants";

/** Modifies the stats of the player based on the player stat passed to the array. */
const ModifyStats = [ // Array index is PlayerStat (int)
    // Damage
    (player: EntityPlayer, value: number, multiply: boolean) => {
        if (player.Damage >= 50) { return; }

        let newDamage = (multiply ? player.Damage * value : player.Damage + value);
        newDamage = Math.min(50, newDamage); // Make sure it can't go above 50
        player.Damage = newDamage;
    },
    // Fire Delay
    (player: EntityPlayer, value: number, multiply: boolean) => {
        if (player.MaxFireDelay <= 0) { return; }

        let newDelay = (multiply ? player.MaxFireDelay * value : player.MaxFireDelay + value);
        newDelay = Math.max(0, newDelay); // Make sure it can't go bellow 0
        player.MaxFireDelay = newDelay;
    },
    // Shot Speed
    (player: EntityPlayer, value: number, multiply: boolean) => {
        if (player.ShotSpeed >= 1.9) { return; }

        let newSpeed = (multiply ? player.ShotSpeed * value : player.ShotSpeed + value);
        newSpeed = Math.min(1.9, newSpeed); // Make sure it can't go above 1.9
        player.ShotSpeed = newSpeed;
    },
    // Tear Height
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearHeight = (multiply ? player.TearHeight * value : player.TearHeight + value) },
    // Range
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearRange = (multiply ? player.TearRange * value : player.TearRange + value) },
    // Tear falling acc
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearFallingAcceleration = (multiply ? player.TearFallingAcceleration * value : player.TearFallingAcceleration + value) },
    // Tear fall speed
    (player: EntityPlayer, value: number, multiply: boolean) => { player.TearFallingSpeed = (multiply ? player.TearFallingSpeed * value : player.TearFallingSpeed + value) },
    // Speed
    (player: EntityPlayer, value: number, multiply: boolean) => {
        if (player.MoveSpeed >= 2) { return; }

        let newSpeed = (multiply ? player.MoveSpeed * value : player.MoveSpeed + value);
        newSpeed = Math.min(2, newSpeed); // Make sure it can't go above 2
        player.MoveSpeed = newSpeed;
    },
    // Tear flags

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => { },
    // Tear color

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => { },
    // Flight
    (player: EntityPlayer, value: number, _multiply: boolean) => { player.CanFly = (value % 2 === 1) },
    // Luck
    (player: EntityPlayer, value: number, multiply: boolean) => { player.Luck = (multiply ? player.Luck * value : player.Luck + value) },
    // Size

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (_player: EntityPlayer, _value: number, _multiply: boolean) => { },
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
        return s === this.stat as number;
    }

    Apply(player: EntityPlayer): void {
        ModifyStats[this.stat].call(this, player, this.amount, this.multiply);
    }

    ToString(): string {
        return `[${PlayerStat[this.stat]},${this.multiply ? "x" : "+"}${this.amount}]`;
    }
}

class DoubleStatOption extends StatOption {
    otherStatOption: StatOption;

    constructor(stat: PlayerStat, amount: number, otherStatOption: StatOption, multiply?: boolean) {
        super(stat, amount, multiply);

        this.otherStatOption = otherStatOption;
    }

    DoesApply2(s: number): boolean {
        return s === this.otherStatOption.stat as number;
    }

    Apply2(player: EntityPlayer): void {
        ModifyStats[this.otherStatOption.stat].call(this, player, this.otherStatOption.amount, this.otherStatOption.multiply);
    }

    override ToString(): string {
        return `[${PlayerStat[this.stat]},${this.multiply ? "x" : "+"}${this.amount}&${this.otherStatOption.ToString()}]`;
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

const statExtensions = Array.from({ length: 13 })


export function init(mod: ModUpgraded): void {
    // mod.AddCallbackCustom(ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED, update);
    mod.AddCallbackCustom(ModCallbackCustom.POST_PLAYER_CHANGE_HEALTH, updateHealth)
    mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, (_) => { initStats(); }, undefined);
    mod.AddCallbackCustom(ModCallbackCustom.POST_DICE_ROOM_ACTIVATED, diceRoom);
    mod.AddCallback(ModCallback.EVALUATE_CACHE, evaluateCache);
}

function initStats() {
    Isaac.DebugString("StatTracker initStats called");

    const seeds: Seeds = Game().GetSeeds();

    const one: Array<[StatOption, float]> = [ // One heart
        [new StatOption(PlayerStat.MOVE_SPEED, 0.3), 15], // Format of Stat, value added, and weight to be chosen.
        [new StatOption(PlayerStat.TEAR_RANGE, 1.2 * 40), 10], // *40 for range since tiles are 40 pixels
    ];
    const two: Array<[StatOption, float]> = [ // Two hearts
        [new StatOption(PlayerStat.TEAR_RANGE, 2.4 * 40), 10],
        [new StatOption(PlayerStat.MOVE_SPEED, 0.3), 12],
        [new StatOption(PlayerStat.LUCK, 1), 8],
        [new StatOption(PlayerStat.DAMAGE, 1), 15],
    ];
    const three: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 2.4 * 40), 8],
        [new StatOption(PlayerStat.DAMAGE, 1), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.15), 10],
    ];
    const four: Array<[StatOption, float]> = [ // Two are chosen at 4 hearts
        [new StatOption(PlayerStat.TEAR_RANGE, 2 * 40), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.25), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.2), 10],
        [new StatOption(PlayerStat.LUCK, 2.5), 6],
    ];
    const five: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.TEAR_RANGE, 1.5 * 40), 6],
        [new StatOption(PlayerStat.DAMAGE, 1.25), 15],
        [new StatOption(PlayerStat.SHOT_SPEED, 0.2), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.4), 8],
    ];
    const six: Array<[StatOption, float]> = [ // Two are chosen
        [new StatOption(PlayerStat.DAMAGE, 1.2, true), 10], // Multiplier. x1.2 and not +1.2
        [new StatOption(PlayerStat.DAMAGE, 1.5), 15],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, 0.85, true), 10], // 0.85x multiplier
        [new StatOption(PlayerStat.LUCK, 4), 3],
    ];
    const seven: Array<[StatOption, float]> = [
        [new StatOption(PlayerStat.DAMAGE, 2.5), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.5), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 4.5 * 40), 8],
        [new StatOption(PlayerStat.LUCK, 3), 10],
    ];
    const eight: Array<[StatOption, float]> = [ // Two are chosen at 12 hearts
        [new StatOption(PlayerStat.DAMAGE, 2.5), 15],
        [new StatOption(PlayerStat.FIRE_DELAY, -0.4), 10],
        [new StatOption(PlayerStat.FIRE_DELAY, 0.95, true), 10],
        [new StatOption(PlayerStat.TEAR_RANGE, 3.5 * 40), 8],
        [new StatOption(PlayerStat.DAMAGE, 1.25, true), 15],
    ];

    statExtensions[0] = getRandomFromWeightedArray(one, seeds.GetNextSeed());
    statExtensions[1] = getRandomFromWeightedArray(two, seeds.GetNextSeed());
    statExtensions[2] = getRandomFromWeightedArray(three, seeds.GetNextSeed());
    statExtensions[3] = getRandomFromWeightedArray(four, seeds.GetNextSeed());

    statExtensions[4] = getRandomFromWeightedArray(five, seeds.GetNextSeed());

    const heart6Stats: StatOption = getRandomFromWeightedArray(six, seeds.GetNextSeed());
    const heart6Stats2: StatOption = getRandomFromWeightedArray(six, seeds.GetNextSeed());
    statExtensions[5] = new DoubleStatOption(heart6Stats.stat, heart6Stats.amount, heart6Stats2, heart6Stats.multiply);

    statExtensions[6] = getRandomFromWeightedArray(seven, seeds.GetNextSeed());
    statExtensions[7] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    // The following are for testing and are not final.
    statExtensions[8] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[9] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[10] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[11] = getRandomFromWeightedArray(eight, seeds.GetNextSeed());

    const heart12Stats: StatOption = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    const heart12Stats2: StatOption = getRandomFromWeightedArray(eight, seeds.GetNextSeed());
    statExtensions[12] = new DoubleStatOption(heart12Stats.stat, heart12Stats.amount, heart12Stats2, heart12Stats.multiply);


    /* for (const o of statExtensions) {
        const stat = o as StatOption;

        Isaac.DebugString(`Registered stat change of ${  stat.ToString()}`);
    }*/

}

/** Called when the player enters a dice room. If the player is Pariku, the stats are reset. */
function diceRoom(player: EntityPlayer, diceFloorSubType: DiceFloorSubType) {
    if (player.GetPlayerType() === PARIKU_TYPE && (diceFloorSubType === DiceFloorSubType.ONE_PIP || diceFloorSubType === DiceFloorSubType.SIX_PIP)) {
        initStats();
        player.AddCacheFlags(CacheFlag.ALL);
        player.EvaluateItems();

        player.TryRemoveNullCostume(COSTUME_PARIKU_HAIR); // Dice rooms can remove the hair costume for some reason???
        player.AddNullCostume(COSTUME_PARIKU_HAIR);       // So we re-add it here, but make sure not to double up
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

function updateHealth(player: EntityPlayer, type: HealthType, _diff: int) {
    // TODO
    if (!(player.GetPlayerType() === PARIKU_TYPE || player.GetPlayerType() === TAINTED_PARIKU_TYPE)) {
        return;
    }

    if (type === HealthType.SOUL || type === HealthType.BLACK) {

        player.AddCacheFlags(CacheFlag.ALL);
        player.EvaluateItems();
    }

}

function evaluateCache(player: EntityPlayer, flag: CacheFlag) {

    if (!(player.GetPlayerType() === PARIKU_TYPE || player.GetPlayerType() === TAINTED_PARIKU_TYPE)) {
        return;
    }




    const currentHealth = player.GetSoulHearts();
    const half: int = Math.floor((currentHealth + 1) / 2);
    const convertedFlag = cacheFlagToPlayerStat[flag];

    if (convertedFlag === undefined) { // Means it isn't a stat we should be checking for
        return;
    }


    // Isaac.DebugString(`Range: ${player.TearRange}`); saac.DebugString(`Speed:
    // ${player.MoveSpeed}`); saac.DebugString(`Damage: ${player.Damage}`);
    // saac.DebugString(`FireDelay: ${player.MaxFireDelay}`); saac.DebugString(`Shot Speed:
    // ${player.ShotSpeed}`); saac.DebugString(`Luck: ${player.Luck}`); saac.DebugString(`Tear
    // Falling Speed: ${player.TearFallingSpeed}`); saac.DebugString(`Tear Falling Acceleration:
    // ${player.TearFallingAcceleration}`);


    const flagname = PlayerStat[convertedFlag];

    for (let i = 0; i < half; i++) {
        if (statExtensions[i] === undefined) {
            Isaac.DebugString(`Could not find stat lookup at index${i}`);
            continue;
        }

        const stat = statExtensions[i] as StatOption;
        // Isaac.DebugString(`Checking stat ${ stat.ToString()} with the flag being ${flagname}.
        // (${convertedFlag})`);.

        if (stat.DoesApply(convertedFlag)) {
            stat.Apply(player);
            // Isaac.DebugString(`Increased stat for type ${ convertedFlag }`);
        }

        if (stat instanceof DoubleStatOption && stat.DoesApply2(convertedFlag)) {
            stat.Apply2(player);
            // Isaac.DebugString(`Increased stat for type2 ${ convertedFlag }`);

        }
    }
}

