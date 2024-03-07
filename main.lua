local mod = RegisterMod("ParikuYumi Character", 1)
local DEBUG = true

NullItemID.PARIKU_HAIR = Isaac.GetCostumeIdByPath("gfx/characters/pariku_hair.anm2")

PlayerType.PARIKU = Isaac.GetPlayerTypeByName("Pariku")

local stats = {}

function mod:addHair(player)
    debug("Pariku Mod: Adding Null Costume")
    player:TryRemoveNullCostume(NullItemID.PARIKU_HAIR)
    if (player:GetPlayerType() == PlayerType.PARIKU) then
        player:AddNullCostume(NullItemID.PARIKU_HAIR)
    end
end

function debug(string)
    if (DEBUG) then
        print(string)
    end
end

--Whether an entity is a soul heart
function mod:isSoulHeart(entity)
    return entity.Type == EntityType.ENTITY_PICKUP and entity.Variant == PickupVariant.PICKUP_HEART and (
        entity.SubType == 3 or --Soul heart
        entity.SubType == 6 or --Black heart
        entity.SubType == 8 or --Half soul heart
        entity.SubType == 10) --Half soul half red
end

function mod:updatePari(player) 

end


mod:AddCallback(ModCallbacks.MC_POST_PLAYER_INIT, mod.addHair, 0)
mod:AddCallback(ModCallbacks.MC_POST_PLAYER_UPDATE, mod.updatePari, 0)
--mod:AddCallback(ModCallbacks.MC_ENTITY_TAKE_DMG, mod.updatePari, 999999) --TODO make this run one tick later