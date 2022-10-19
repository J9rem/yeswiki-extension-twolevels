# Extension twolevels

Cette extension crée des listes à deux niveaux.

## Configuration

### Pour chaque liste à deux niveaux

  1. créer le niveau le plus bas :
    - créer une liste avec toutes les valeurs possibles
    - ou créer un formulaire qui peut ne contenir que le champ titre et ajouter une fiche pour chaque valeur
    - Comparaison entre les deux méthodes :
      
      | **Méthode**    | **liste**               | **formulaire**                                      |
      |:---------------|:------------------------|:----------------------------------------------------|
      | **Complexité** | Simple (juste la liste) | Complexe (2 étapes : le formulaire puis les fiches) |
      | **Droits**     | liste modifiable uniquement par les administrateurs | les fiches peuvent être créées et/ou modifiées par des non-administrateurs (selon paramètres) |
      | **Extensible&nbsp;?**| Niveau supplémentaire impossible| Possibilité d'insérer un autre sous-niveau|
    - noter le nom de la liste ou le numéro du formulaire ainsi créé
  2. créer le niveau le plus haut :
    - créer un nouveau formulaire dit formulaire _parent_
    - dans ce formulaire, en plus du champ `bf_titre`, ajouter un champ de type `checkbox`, `radio`, `liste`, `checkboxfiche`, `radiofiche` ou `listefiche` :
       - si le niveau le plus bas est une **liste**, choisir parmis `checkbox` (case à cocher), `radio` (bouton radio) ou `liste` (sélection), puis sélectionner la liste correspond au niveau le plus bas
       - si le niveau le plus bas est un **formulaire**, choisir parmis `checkboxfiche` (case à cocher), `radiofiche` (bouton radio) ou `listefiche` (sélection), puis sélectionner le formulaire correspond au niveau le plus bas
    - il est possible de choisir la méthode d'affichage désirée pour l'association entre les deux niveaux (`normal`, `par tags` ou `drag and drop`)
    - il n'y a pas d'importance dans le choix du type de lien (`checkbox`, `radio` ou `liste`). Il faut prendre ce qui est le plus pratique. **Attention**, seul le mode `checkbox` (case à cocher) permet d'associer plusieurs niveaux bas à un même niveau haut.
  3. Créer une fiche dans le formulaire de niveau haut pour chaque catégorie de niveau haut
    - pour chaque fiche, sélectionner dans le champ associé les éléments du niveau bas qui correspondent.
    - un même niveau bas peut-être associé à plusieurs niveaux hauts.

### Insertion dans le formulaire où la liste à deux niveaux va servir
    
 1. insérer un champ de type `checkboxfiche`, `radiofiche` ou `listefiche` pour le niveau haut (la méthode d'affichage n'a pas d'importance)
 2. sélectionner le formulaire de haut niveau pour ce champ
 3. choisir un nom pour ce champ (par exemple, `bf_listehaut` et le noter)
 4. ajouter un champ `enumlevel2` (liste à 2 niveaux)
      - donner le nom du champ de haut niveau (champ parent), (dans notre exemple `bf_listehaut`)
      - pour accélérer l'affichage des données, choisir aussi le formulaire associé au niveau haut
      - choisir le type d'affichage souhaité pour ce niveau en faisant attention à choisir un affichage de type liste si le niveau bas est une liste (sinon choisir un affichage de type formulaire)
      - le reste des paramètres du champ sont ceux des champs `checkboxfiche`, `radiofiche` ou `listefiche`
 5. sauvegarder le formulaire

## Utilisation

Lors de la saisie d'une fiche dans le formulaire cible, une modification de la valeur du champ de haut niveau (cases à cocher, bouton radio, liste), va produire la mise à jour du niveau bas en fonction des valeurs sélectionnées pour le niveau haut.

Le système de filtre par `facettes` fonctionne aussi.

**Astuce** : dans l'éditeur d'action yeswiki via le bouton `composants`, il est maintenant possible de choisir le comportement des filtres au sein du même facette entre `ou` (comportement par défaut) et `et`.

Pour faire le réglage:
 - modifier une action `bazarliste`
 - cocher les paramètres avancés
 - rechercher le réglage juste en dessous des `facettes`