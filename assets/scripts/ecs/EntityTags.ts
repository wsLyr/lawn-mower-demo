/**
 * 实体标签常量
 */
export const EntityTags = {
    PLAYER: 1,
    ENEMY: 2,
    BULLET: 3,
    COLLECTIBLE: 4,
    SPAWNER: 5
} as const;

export type EntityTag = typeof EntityTags[keyof typeof EntityTags]; 