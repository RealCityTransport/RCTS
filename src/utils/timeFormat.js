// src/utils/timeFormat.js

/**
 * KST(Asia/Seoul)를 기준으로
 * YYYY. MM. DD. HH:MM 형식의 문자열로 포맷한다.
 *
 * - 입력: Date 객체 또는 timestamp(ms)
 * - 출력 예: 2025. 01. 05. 14:37
 */
export function formatKstTimeYYYYMMDDHHMM(input) {
  const date = input instanceof Date ? input : new Date(input)

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)

  const get = (type) => parts.find((p) => p.type === type)?.value ?? ''

  const yyyy = get('year')
  const mm = get('month')
  const dd = get('day')
  const hh = get('hour')
  const min = get('minute')

  return `${yyyy}. ${mm}. ${dd}. ${hh}:${min}`
}
