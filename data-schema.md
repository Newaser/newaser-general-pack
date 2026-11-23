# 武将扩展包 Wiki 数据结构方案

本文定义扩展包、子包、武将、技能、游戏牌、机制和图片的数据字段。数据以 JSON 保存，字段名统一使用 `camelCase`。每个实体的 `id` 在同类数据中唯一且稳定；实体间通过 ID 建立关联。

## 项目目录结构

```text
项目根目录/
├── data/
│   ├── packs.json       # 扩展包
│   ├── subpacks.json    # 子包
│   ├── generals.json    # 武将
│   ├── skills.json      # 技能
│   ├── cards.json       # 游戏牌
│   ├── rules.json       # 机制
│   └── images.json      # 图片资源元数据
├── image/
│   ├── general/         # 武将图片文件
│   ├── card/            # 游戏牌图片文件
│   └── rule/            # 机制说明图片文件
├── data-schema.md       # 本数据结构说明
└── general-roster.md    # 武将清单
```

每个 JSON 文件保存对应类型实体的数组，实体间按本文件定义的 ID 字段关联。图片文件保存在 `image/` 下对应的分类目录中，`images.json` 记录图片的 ID、相对路径及作者信息；JSON 中的图片路径使用相对于项目根目录的正斜杠路径，例如 `image/general/spr/machao.png`。

## 通用约定

- 字段名使用小驼峰，例如 `subpackId`、`derivativeImages`。
- `id` 是实体的稳定标识。名称或描述调整时通常不改 ID。
- 关联字段存储目标实体的 ID；复数关联字段存储 ID 数组。
- 标记为“可选”的字段可省略，也可按项目约定用空值表示无内容。建议同一字段统一一种空值表示方式；数值字段若 `0` 有实际含义，不应把 `0` 同时当作“未填写”。
- 下文的 `subpack`、`image` 等是实体类型名称，JSON 属性仍采用代码中所写的字段名。

## 包 `pack`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 包的唯一、稳定标识。 |
| `name` | string | 是 | 包的显示名称，例如 `☆SPR`。 |
| `subpacks` | string[] | 否 | 此包包含的子包 ID 列表。 |

## 子包 `subpack`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 子包的唯一、稳定标识。 |
| `name` | string | 是 | 子包的显示名称。 |
| `generals` | string[] | 否 | 此子包收录的武将 ID 列表。 |
| `cards` | string[] | 否 | 此子包收录的游戏牌 ID 列表。 |
| `rules` | string[] | 否 | 此子包涉及的机制 ID 列表。 |

## 武将 `general`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 武将的唯一、稳定标识。 |
| `code` | string | 否 | 武将卡牌编号，例如星马超的 `☆SPR 001`。保留编号原有格式。 |
| `name` | string | 是 | 武将名称，例如 `星马超`。 |
| `gender` | string | 是 | 性别；取值限定为 `男性`、`女性`、`双性`、`无性`。 |
| `title` | string | 否 | 武将称号。 |
| `kingdom` | string | 是 | 武将的主要势力。 |
| `subkingdom` | string | 否 | 副势力，用于双势力武将。单势力武将通常留空。 |
| `hp` | number | 是 | 武将设计上的体力值，是静态属性，不区分初始体力和当前体力。 |
| `maxHp` | number | 是 | 武将设计上的体力上限。 |
| `shield` | number | 否 | 武将设计上的护甲值。 |
| `skills` | string[] | 否 | 武将拥有的技能 ID 列表。 |
| `designer` | string 或 string[] | 否 | 武将设计者；多人时可使用字符串数组。 |
| `image` | string | 否 | 武将主图对应的图片 ID。 |
| `derivativeImages` | string[] | 否 | 与武将相关的衍生图片 ID 列表。 |

## 技能 `skill`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 技能的唯一、稳定标识。 |
| `name` | string | 是 | 技能名称。 |
| `tags` | string[] | 否 | 技能标签，用于标明技能规则类别，例如 `锁定技`、`限定技`、`觉醒技`、`使命技`、`蓄力技`。 |
| `description` | string | 否 | 技能效果或规则描述文本。 |
| `images` | object | 否 | 此技能关联的图片。包含可选的 `main` 图片 ID 和 `derivatives` 衍生图片 ID 列表。 |
| `derivatives` | object | 否 | 此技能关联或衍生的实体，按 `skills`、`cards`、`rules` 分组保存对应 ID 数组。衍生技能可不在当前包或 `skills.json` 中定义。 |

## 游戏牌 `card`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 游戏牌的唯一、稳定标识。 |
| `name` | string | 是 | 游戏牌名称。 |
| `type` | string | 是 | 游戏牌的主类型，例如基本牌、锦囊牌、装备牌。 |
| `subtype` | string | 否 | 游戏牌的子类型，例如武器、防具、延时锦囊。 |
| `attackRange` | number | 否 | 游戏牌的攻击范围；通常用于具有攻击范围的牌。 |
| `description` | string | 否 | 游戏牌的效果或规则描述。 |
| `images` | object | 否 | 此游戏牌关联的图片。包含可选的 `main` 图片 ID 和 `derivatives` 衍生图片 ID 列表。 |
| `derivatives` | object | 否 | 此游戏牌关联或衍生的实体，按 `skills`、`cards`、`rules` 分组保存对应 ID 数组。 |

## 机制 `rule`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 机制的唯一、稳定标识。 |
| `name` | string | 是 | 机制名称。 |
| `description` | string | 否 | 机制的规则说明或补充解释。 |
| `images` | object | 否 | 此机制关联的图片。包含可选的 `main` 图片 ID 和 `derivatives` 衍生图片 ID 列表。 |
| `derivatives` | object | 否 | 此机制关联或衍生的实体，按 `skills`、`cards`、`rules` 分组保存对应 ID 数组。 |

## 图片 `image`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---:|---|
| `id` | string | 是 | 图片资源的唯一、稳定标识，供其他实体引用。 |
| `path` | string | 是 | 图片相对于网站静态资源根目录的路径，例如 `image/general/spr/machao.png`。 |
| `author` | string | 否 | 图片作品的作者或版权署名。 |
| `illustrator` | string | 否 | 图片的绘制者或插画师。若与 `author` 是同一概念，可只填写一个字段或统一约定两者用法。 |

## `skill`、`card`、`rule` 的关联对象结构

以上三种实体的 `images` 和 `derivatives` 字段采用以下结构。没有相关内容时可省略整个字段；没有某个子类型的关联时可省略对应子字段。

| 字段 | 类型 | 含义 |
|---|---|---|
| `images.main` | string | 主图的图片 ID。 |
| `images.derivatives` | string[] | 衍生图片 ID 列表。 |
| `derivatives.skills` | string[] | 关联或衍生的技能 ID 列表。 |
| `derivatives.cards` | string[] | 关联或衍生的游戏牌 ID 列表。 |
| `derivatives.rules` | string[] | 关联或衍生的机制 ID 列表。 |

示例：

```json
{
  "images": {
    "main": "skill-example",
    "derivatives": ["skill-example#0"]
  },
  "derivatives": {
    "skills": ["skill-related"],
    "cards": ["card-example"],
    "rules": ["rule-example"]
  }
}
```

## 关系概览

```text
pack.subpacks             -> subpack.id
subpack.generals          -> general.id
subpack.cards             -> card.id
subpack.rules             -> rule.id
general.skills            -> skill.id
general.image             -> image.id
general.derivativeImages  -> image.id
skill.images.main         -> image.id
skill.images.derivatives  -> image.id
skill.derivatives.skills  -> skill.id (目标记录可不存在)
skill.derivatives.cards   -> card.id
skill.derivatives.rules   -> rule.id
card.images.main          -> image.id
card.images.derivatives   -> image.id
card.derivatives.skills   -> skill.id
card.derivatives.cards    -> card.id
card.derivatives.rules    -> rule.id
rule.images.main          -> image.id
rule.images.derivatives   -> image.id
rule.derivatives.skills   -> skill.id
rule.derivatives.cards    -> card.id
rule.derivatives.rules    -> rule.id
```
