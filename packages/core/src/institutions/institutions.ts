import { INSTITUTIONS_DATASET } from "./institutions-data";
import { parseInstitutionsDataset, type Institution } from "./institution";

export const INSTITUTIONS: readonly Institution[] = parseInstitutionsDataset(INSTITUTIONS_DATASET);

export function institutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find((institution) => institution.id === id);
}
