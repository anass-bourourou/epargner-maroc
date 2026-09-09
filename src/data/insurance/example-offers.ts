// -----------------------------------------------------------------------------
// Données ILLUSTRATIVES pour la démonstration du comparateur.
// ---------------------------------------------------------
// Aucune de ces lignes ne représente une offre commerciale réelle.
// Les noms de "compagnie" sont des marqueurs (Formule A / Formule B / Formule C).
// Le composant OfferComparisonTable applique en permanence un bandeau
// « Exemple pédagogique — à remplacer par des données vérifiées ».
//
// Quand des données réelles seront disponibles :
//   - remplacer chaque objet par la donnée sourcée
//   - renseigner `sources[]` avec des URLs vérifiables
//   - renseigner `updatedAt` à la date de vérification
//   - basculer `illustrative` à `false` après revue humaine
// -----------------------------------------------------------------------------

import type { InsuranceFamilyKey } from './families';

export type OfferCell = 'yes' | 'no' | 'option' | string;

export interface InsuranceOffer {
  id: string;
  brand: string;
  formulaLabel: string;
  cells: Record<string, OfferCell>;
  updatedAt: Date;
  sources: string[]; // Empty for illustrative rows.
  /** Must always be true for the mock rows shipped in the repo. */
  illustrative: true;
}

const ILLUSTRATIVE_DATE = new Date('2026-08-18');

export const EXAMPLE_OFFERS: Record<InsuranceFamilyKey, InsuranceOffer[]> = {
  auto: [
    {
      id: 'auto-a',
      brand: 'Formule A',
      formulaLabel: 'Tiers simple',
      cells: {
        formula: 'Tiers',
        rc: 'yes',
        dmg: 'no',
        theft: 'no',
        glass: 'option',
        assist: 'yes',
        deductible: '—',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'auto-b',
      brand: 'Formule B',
      formulaLabel: 'Tiers étendu',
      cells: {
        formula: 'Tiers +',
        rc: 'yes',
        dmg: 'option',
        theft: 'yes',
        glass: 'yes',
        assist: 'yes',
        deductible: 'variable',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'auto-c',
      brand: 'Formule C',
      formulaLabel: 'Tous risques',
      cells: {
        formula: 'Tous risques',
        rc: 'yes',
        dmg: 'yes',
        theft: 'yes',
        glass: 'yes',
        assist: 'yes',
        deductible: 'oui',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
  ],

  habitation: [
    {
      id: 'hab-a',
      brand: 'Formule A',
      formulaLabel: 'Essentiel',
      cells: {
        formula: 'Base',
        fire: 'yes',
        water: 'yes',
        theft: 'option',
        rc: 'yes',
        valuables: 'no',
        deductible: 'fixe',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'hab-b',
      brand: 'Formule B',
      formulaLabel: 'Confort',
      cells: {
        formula: 'Étendue',
        fire: 'yes',
        water: 'yes',
        theft: 'yes',
        rc: 'yes',
        valuables: 'option',
        deductible: 'variable',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'hab-c',
      brand: 'Formule C',
      formulaLabel: 'Premium',
      cells: {
        formula: 'Complète',
        fire: 'yes',
        water: 'yes',
        theft: 'yes',
        rc: 'yes',
        valuables: 'yes',
        deductible: 'proportionnelle',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
  ],

  sante: [
    {
      id: 'sante-a',
      brand: 'Formule A',
      formulaLabel: 'Essentiel',
      cells: {
        formula: 'Base',
        consult: '70 %',
        hosp: '80 %',
        dental: 'option',
        optic: 'option',
        wait: '3 mois',
        network: 'restreint',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'sante-b',
      brand: 'Formule B',
      formulaLabel: 'Confort',
      cells: {
        formula: 'Étendue',
        consult: '85 %',
        hosp: '90 %',
        dental: 'yes',
        optic: 'yes',
        wait: '1 mois',
        network: 'élargi',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'sante-c',
      brand: 'Formule C',
      formulaLabel: 'Premium',
      cells: {
        formula: 'Complète',
        consult: '100 %',
        hosp: '100 %',
        dental: 'yes',
        optic: 'yes',
        wait: 'aucune',
        network: 'ouvert',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
  ],

  voyage: [
    {
      id: 'voy-a',
      brand: 'Formule A',
      formulaLabel: 'Court séjour',
      cells: {
        formula: 'Base',
        medical: 'plafond bas',
        repat: 'yes',
        cancel: 'option',
        luggage: 'option',
        sports: 'no',
        assist: 'yes',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'voy-b',
      brand: 'Formule B',
      formulaLabel: 'Confort',
      cells: {
        formula: 'Étendue',
        medical: 'plafond moyen',
        repat: 'yes',
        cancel: 'yes',
        luggage: 'yes',
        sports: 'option',
        assist: 'yes',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'voy-c',
      brand: 'Formule C',
      formulaLabel: 'Long séjour',
      cells: {
        formula: 'Complète',
        medical: 'plafond haut',
        repat: 'yes',
        cancel: 'yes',
        luggage: 'yes',
        sports: 'yes',
        assist: 'yes',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
  ],

  vie: [
    {
      id: 'vie-a',
      brand: 'Formule A',
      formulaLabel: 'Épargne',
      cells: {
        type: 'Épargne',
        entryFee: 'faibles',
        mgmtFee: 'moyens',
        guaranteed: 'partiel',
        flexibility: 'yes',
        beneficiary: 'oui',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'vie-b',
      brand: 'Formule B',
      formulaLabel: 'Prévoyance',
      cells: {
        type: 'Prévoyance',
        entryFee: 'variables',
        mgmtFee: 'faibles',
        guaranteed: 'no',
        flexibility: 'no',
        beneficiary: 'oui',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
    {
      id: 'vie-c',
      brand: 'Formule C',
      formulaLabel: 'Mixte',
      cells: {
        type: 'Mixte',
        entryFee: 'variables',
        mgmtFee: 'moyens',
        guaranteed: 'partiel',
        flexibility: 'yes',
        beneficiary: 'oui',
      },
      updatedAt: ILLUSTRATIVE_DATE,
      sources: [],
      illustrative: true,
    },
  ],
};
