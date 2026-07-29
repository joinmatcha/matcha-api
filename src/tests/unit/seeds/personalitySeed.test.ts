import { seedPersonalityTest } from '@/seeds/seedPersonalityTest';

const preciseJobLabels = [
  'manager',
  'chef de projet',
  'développeur',
  'developpeur',
  'vendeur',
  'comédien',
  'comedien',
  'infirmier',
  'enseignant',
  'auditeur',
  'comptable',
  'photographe',
  'technicien',
  'mécanicien',
  'mecanicien',
  'formateur',
  'rédacteur',
  'redacteur',
  'coach',
  'thérapeute',
  'therapeute',
];

describe('personality seed content', () => {
  it('uses broad sectors instead of precise jobs for personality suggestions', () => {
    const source = seedPersonalityTest.toString().toLocaleLowerCase('fr-FR');

    for (const label of preciseJobLabels) {
      expect(source).not.toContain(`'${label}'`);
    }
  });
});
