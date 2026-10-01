import { interpolate } from "@/lib/interpolate";

import { t } from "./strings";

export const GUIDE_PATH = "/como-usar";

type Topic = { title: string; body: string };
type SectionCopy = { title: string; topics: readonly Topic[] };
type LinkedSectionCopy = SectionCopy & { screen: string };

export type GuideSection = {
  id: string;
  title: string;
  topics: readonly Topic[];
  link: { label: string; href: string } | null;
};

function linked(id: string, copy: LinkedSectionCopy, href: string): GuideSection {
  return {
    id,
    title: copy.title,
    topics: copy.topics,
    link: { label: interpolate(t.goTo, "{screen}", copy.screen), href },
  };
}

function unlinked(id: string, copy: SectionCopy): GuideSection {
  return { id, title: copy.title, topics: copy.topics, link: null };
}

export const MEU_PLUGGY_SECTION_ID = "meu-pluggy";

export const MEU_PLUGGY_GUIDE_HREF = `${GUIDE_PATH}#${MEU_PLUGGY_SECTION_ID}`;

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  linked("primeiros-passos", t.sections.firstSteps, "/casa"),
  linked(MEU_PLUGGY_SECTION_ID, t.sections.meuPluggy, "/conectar-banco"),
  linked("contas-e-casas", t.sections.accounts, "/"),
  linked("sincronizacao", t.sections.sync, "/"),
  linked("transacoes", t.sections.transactions, "/transacoes"),
  linked("categorias", t.sections.categories, "/categorias"),
  linked("visao-geral", t.sections.overview, "/"),
  linked("reserva", t.sections.reserve, "/reserva"),
  unlinked("privacidade", t.sections.privacy),
  unlinked("perguntas-frequentes", t.sections.faq),
];
