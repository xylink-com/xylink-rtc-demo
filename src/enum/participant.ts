import { isPc } from '@/utils/browser';

// 最大参会人数
export const MAX_PARTICIPANT_COUNT = 500;
// 参会者列表 每页最多显示个数
export const PARTICIPANT_PAGE_SIZE = isPc ? 20 : 10;
// 参会者按钮，人数显示的最大值
export const MAX_PARTICIPANT_COUNT_SHOW = 9999;
// 参会者抽屉宽度
export const PARTICIPANT_WIDTH_PC = 300;
