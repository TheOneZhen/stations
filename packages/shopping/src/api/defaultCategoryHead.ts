import type { CategoryHead } from "@/types/category/CategoryHead"

const titles = [
  "居家",
  "美食",
  "服饰",
  "母婴",
  "个护",
  "严选",
  "数码",
  "运动",
  "杂货",
]

export default titles.map(
  (title) =>
    ({
      id: "",
      name: title,
      picture: "",
      children: [],
      goods: [],
    } as CategoryHead)
)
