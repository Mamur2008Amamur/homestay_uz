import { trpc } from "@/lib/trpc";
import { mergeStayCatalog, type StayItem } from "./stays";

export function useStays(): StayItem[] {
  const { data } = trpc.listings.search.useQuery({});
  return mergeStayCatalog((data ?? []) as StayItem[]);
}
