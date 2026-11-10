/** 校验 ISO 日期是否对应真实日历日期。 */
export declare function isIsoDate(value: unknown): value is string;
/** 校验日期或日期区间是否完整、有序且处于可选范围内。 */
export declare function isDatePickerValueValid(value: string, mode: 'single' | 'range', min?: string, max?: string): boolean;
