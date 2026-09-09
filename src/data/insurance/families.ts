// -----------------------------------------------------------------------------
// Éditorial — cinq familles d'assurances.
// Contenu pédagogique uniquement. Aucune donnée de prix, marque ou classement.
// -----------------------------------------------------------------------------

export const INSURANCE_FAMILY_KEYS = [
  'auto',
  'habitation',
  'sante',
  'voyage',
  'vie',
] as const;

export type InsuranceFamilyKey = (typeof INSURANCE_FAMILY_KEYS)[number];

export interface InsuranceFamily {
  key: InsuranceFamilyKey;
  label: string;
  href: string;
  title: string;
  intro: string;
  covered: string[];
  notCovered: string[];
  keyQuestions: string[];
  /** Column headers (short labels) for the comparator table of this family. */
  criteria: {
    key: string;
    label: string;
    /** Optional short description shown in the legend. */
    hint?: string;
  }[];
  seoDescription: string;
}

export const INSURANCE_FAMILIES: Record<InsuranceFamilyKey, InsuranceFamily> = {
  auto: {
    key: 'auto',
    label: 'Auto',
    href: '/assurances/auto/',
    title: 'Assurance auto — comprendre avant de signer',
    intro:
      "Deux niveaux de couverture principaux, une même logique : ce que vous payez chaque année versus ce qui est réellement couvert en cas de sinistre. Ce que vous devez examiner avant de signer.",
    covered: [
      'Responsabilité civile obligatoire (dommages causés aux tiers)',
      'Défense-recours et protection juridique de base selon la formule',
      'Dommages tous risques selon la formule (collision, vol, incendie)',
      'Bris de glace, catastrophes naturelles selon les options souscrites',
    ],
    notCovered: [
      "Dommages liés à un usage non déclaré du véhicule",
      "Sinistres survenus sous l'emprise d'alcool ou de stupéfiants",
      "Aménagements ou équipements non déclarés à la souscription",
      "Franchises restant à la charge de l'assuré",
    ],
    keyQuestions: [
      'La formule prend-elle en charge la valeur à neuf ou la valeur vénale ?',
      'Quelle est la franchise en cas de sinistre responsable ?',
      "L'assistance couvre-t-elle le remorquage 0 km ?",
      "Le prêt de véhicule est-il inclus, optionnel, ou absent ?",
    ],
    criteria: [
      { key: 'formula', label: 'Formule' },
      { key: 'rc', label: 'RC obligatoire', hint: 'Responsabilité civile' },
      { key: 'dmg', label: 'Dommages', hint: 'Collision / bris' },
      { key: 'theft', label: 'Vol' },
      { key: 'glass', label: 'Bris de glace' },
      { key: 'assist', label: 'Assistance' },
      { key: 'deductible', label: 'Franchise' },
    ],
    seoDescription:
      "Assurance auto au Maroc — RC, tiers, tous risques, franchises, exclusions : le cadre pour lire un contrat avant de signer.",
  },
  habitation: {
    key: 'habitation',
    label: 'Habitation',
    href: '/assurances/habitation/',
    title: 'Assurance habitation — lire une police en 10 minutes',
    intro:
      "La multirisque habitation couvre le logement, son contenu, et la responsabilité civile de l'occupant. Encore faut-il savoir ce qui est réellement inclus, plafonné, ou exclu.",
    covered: [
      "Incendie, explosion, dégâts des eaux (avec les plafonds indiqués)",
      "Responsabilité civile de l'occupant vis-à-vis des tiers",
      "Vol et vandalisme selon les conditions du contrat",
      "Catastrophes naturelles selon les garanties souscrites",
    ],
    notCovered: [
      "Défauts d'entretien manifestes du logement",
      "Objets de valeur non déclarés au-delà d'un plafond",
      "Sinistres antérieurs à la souscription",
      "Locations saisonnières non déclarées",
    ],
    keyQuestions: [
      "Quels sont les plafonds par catégorie de bien ?",
      "Les objets précieux nécessitent-ils une déclaration séparée ?",
      "La franchise est-elle fixe ou proportionnelle au sinistre ?",
      "Le déménagement est-il couvert pendant sa durée ?",
    ],
    criteria: [
      { key: 'formula', label: 'Formule' },
      { key: 'fire', label: 'Incendie' },
      { key: 'water', label: 'Dégâts des eaux' },
      { key: 'theft', label: 'Vol' },
      { key: 'rc', label: 'RC', hint: 'Responsabilité civile' },
      { key: 'valuables', label: 'Objets précieux' },
      { key: 'deductible', label: 'Franchise' },
    ],
    seoDescription:
      "Assurance habitation au Maroc — multirisque, RC occupant, plafonds, exclusions. Comprendre un contrat avant de signer.",
  },
  sante: {
    key: 'sante',
    label: 'Santé',
    href: '/assurances/sante/',
    title: 'Assurance santé — complémentaire, plafonds, réseau',
    intro:
      "Une complémentaire santé se juge sur le taux de remboursement effectif, les plafonds par acte, et le réseau de soins acceptés. Les grandes différences se cachent dans les tableaux annexes du contrat.",
    covered: [
      "Consultations, examens, hospitalisation selon les taux du contrat",
      "Optique et dentaire selon les plafonds annuels",
      "Médicaments remboursés selon la liste homologuée",
      "Maternité et actes spécialisés selon la formule",
    ],
    notCovered: [
      "Actes esthétiques non médicalement justifiés",
      "Traitements expérimentaux ou hors nomenclature",
      "Périodes de carence en début de contrat",
      "Certaines affections préexistantes selon les clauses",
    ],
    keyQuestions: [
      "Quel est le ticket modérateur restant à ma charge ?",
      "Y a-t-il une période de carence pour l'optique et le dentaire ?",
      "Le réseau de soins inclut-il mes médecins habituels ?",
      "Les plafonds sont-ils annuels ou par acte ?",
    ],
    criteria: [
      { key: 'formula', label: 'Formule' },
      { key: 'consult', label: 'Consultation' },
      { key: 'hosp', label: 'Hospitalisation' },
      { key: 'dental', label: 'Dentaire' },
      { key: 'optic', label: 'Optique' },
      { key: 'wait', label: 'Carence' },
      { key: 'network', label: 'Réseau' },
    ],
    seoDescription:
      "Assurance santé au Maroc — complémentaires, plafonds, tickets modérateurs, réseau de soins. Comprendre les tableaux d'un contrat.",
  },
  voyage: {
    key: 'voyage',
    label: 'Voyage',
    href: '/assurances/voyage/',
    title: 'Assurance voyage — assistance, rapatriement, annulation',
    intro:
      "Une assurance voyage utile combine trois volets : l'assistance médicale à l'étranger, le rapatriement, et la couverture financière en cas d'annulation ou de perte de bagages.",
    covered: [
      "Frais médicaux à l'étranger jusqu'au plafond du contrat",
      "Rapatriement sanitaire",
      "Annulation pour motifs prévus au contrat",
      "Perte, vol ou détérioration des bagages selon le plafond",
    ],
    notCovered: [
      "Sports à risque non déclarés à la souscription",
      "Épidémies exclues au contrat",
      "Annulations pour motifs non prévus",
      "Objets de valeur au-delà d'un seuil sans déclaration",
    ],
    keyQuestions: [
      "Quel est le plafond des frais médicaux à l'étranger ?",
      "Les activités sportives prévues sont-elles couvertes ?",
      "Le contrat prévoit-il l'annulation pour motif professionnel ?",
      "L'assistance est-elle joignable 24/7 en français ?",
    ],
    criteria: [
      { key: 'formula', label: 'Formule' },
      { key: 'medical', label: 'Frais médicaux' },
      { key: 'repat', label: 'Rapatriement' },
      { key: 'cancel', label: 'Annulation' },
      { key: 'luggage', label: 'Bagages' },
      { key: 'sports', label: 'Sports' },
      { key: 'assist', label: 'Assistance 24/7' },
    ],
    seoDescription:
      "Assurance voyage — frais médicaux, rapatriement, annulation, bagages. Ce qu'une bonne couverture voyage inclut réellement.",
  },
  vie: {
    key: 'vie',
    label: 'Vie',
    href: '/assurances/vie/',
    title: "Assurance vie — épargne, prévoyance, bénéficiaires",
    intro:
      "Selon sa nature, un contrat d'assurance vie sert à épargner sur le long terme, à protéger des bénéficiaires en cas de décès, ou à combiner les deux. Les frais, la clause bénéficiaire, et la fiscalité en font toute la différence.",
    covered: [
      "Constitution progressive d'un capital (contrats d'épargne)",
      "Versement d'un capital ou d'une rente aux bénéficiaires (contrats prévoyance)",
      "Fiscalité favorable selon les conditions légales",
      "Modularité des versements sur la plupart des contrats",
    ],
    notCovered: [
      "Rendement garanti au-delà de ce que le contrat stipule",
      "Sortie en capital sans frais avant certaines durées",
      "Certaines causes de décès exclues selon le contrat",
      "Frais de gestion souvent sous-estimés à la souscription",
    ],
    keyQuestions: [
      "Quels sont les frais d'entrée, de gestion et d'arbitrage ?",
      "La clause bénéficiaire est-elle bien rédigée pour ma situation ?",
      "Quelle est la performance historique nette de frais ?",
      "Quelles sont les conditions de sortie anticipée ?",
    ],
    criteria: [
      { key: 'type', label: 'Type' },
      { key: 'entryFee', label: "Frais d'entrée" },
      { key: 'mgmtFee', label: 'Frais de gestion' },
      { key: 'guaranteed', label: 'Capital garanti' },
      { key: 'flexibility', label: 'Souplesse' },
      { key: 'beneficiary', label: 'Bénéficiaires' },
    ],
    seoDescription:
      "Assurance vie — épargne, prévoyance, clause bénéficiaire, frais, fiscalité. Les critères qui font toute la différence.",
  },
};
