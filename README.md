# JIRAMA - Gestion électricité maison

Application web React + TypeScript pour gérer 2 grands compteurs et leurs sous-compteurs, calculer le prix du kWh et le montant à payer par sous-compteur.

## Fonctionnalités

- Gestion de 2 compteurs principaux (Compteur 1 et Compteur 2)
- Sous-compteurs:
  - Compteur 1: S01 à S07
  - Compteur 2: S01 à S06
- Saisie mensuelle: index précédent / actuel
- Calcul automatique:
  - Consommation = actuel - précédent
  - Prix kWh = facture / consommation totale
  - Montant sous-compteur = consommation sous-compteur × prix kWh
- Mode consommation totale:
  - Par compteur principal
  - Ou saisie directe donnée par JIRAMA
- Résumé de vérification par compteur:
  - Total consommation sous-compteurs
  - Total montant à payer
  - Écart de contrôle avec compteur principal
- Données enregistrées en local (localStorage)

## Lancer le projet

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Stack technique

- React
- TypeScript
- Vite
- CSS responsive

## Auteur

Projet préparé pour la gestion interne de consommation JIRAMA (maison).
