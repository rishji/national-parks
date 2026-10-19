import { dateSortKey, formatVisitDates, parsePartialDate, sortVisitsChronological, sortVisitsNewestFirst } from "./dates";

test("parsePartialDate accepts year, month, day", () => {
  expect(parsePartialDate("2021")).toEqual({ y: 2021 });
  expect(parsePartialDate("2021-05")).toEqual({ y: 2021, m: 5 });
  expect(parsePartialDate("2021-05-28")).toEqual({ y: 2021, m: 5, d: 28 });
});

test.each(["21", "2021-5", "2021-13", "2021-02-30", "May 2021", ""])("parsePartialDate rejects %s", (s) => {
  expect(() => parsePartialDate(s)).toThrow(/Invalid date/);
});

test("dateSortKey fills missing parts by edge", () => {
  expect(dateSortKey("2021", "start")).toBe("2021-01-01");
  expect(dateSortKey("2021", "end")).toBe("2021-12-31");
  expect(dateSortKey("2021-02", "end")).toBe("2021-02-28");
  expect(dateSortKey("2024-02", "end")).toBe("2024-02-29");
});

test.each([
  [undefined, undefined, "Date TBD"],
  ["2021", undefined, "2021"],
  ["2021-05", undefined, "May 2021"],
  ["2021-05-28", undefined, "May 28, 2021"],
  ["2021-05-28", "2021-05-30", "May 28–30, 2021"],
  ["2021-05-28", "2021-06-02", "May 28 – Jun 2, 2021"],
  ["2021-12-30", "2022-01-02", "Dec 30, 2021 – Jan 2, 2022"],
  ["2021-05", "2021-06", "May – Jun 2021"],
  ["2021-05-28", "2021-05-28", "May 28, 2021"],
])("formatVisitDates(%s, %s) = %s", (s, e, out) => expect(formatVisitDates(s, e)).toBe(out));

test("sortVisitsNewestFirst puts dated newest first and undated last, stable", () => {
  const v = [
    { park: "a" },
    { park: "b", start: "2019" },
    { park: "c", start: "2023-04" },
    { park: "d" },
    { park: "e", start: "2021-07-04" },
  ];
  expect(sortVisitsNewestFirst(v).map((x) => x.park)).toEqual(["c", "e", "b", "a", "d"]);
});

test("sortVisitsChronological splits undated out", () => {
  const v = [{ park: "a" }, { park: "b", start: "2023" }, { park: "c", start: "2019-02" }];
  const r = sortVisitsChronological(v);
  expect(r.dated.map((x) => x.park)).toEqual(["c", "b"]);
  expect(r.undated.map((x) => x.park)).toEqual(["a"]);
});
