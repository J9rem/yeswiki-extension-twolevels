# Extension twolevels

This extension creates two levels lists in bazar. 

## Configuration

### For each list of second level

  1. create the low level :
    - create a list with all wanted values
    - or create a form which can contain only a title field and add anentry for each value
    - Comparison of two methods:
      
      | **Method**    | **list**               | **form**                                      |
      |:---------------|:------------------------|:----------------------------------------------------|
      | **Complexity** | Simple (only a list) | Complex (2 steps : a form and the entries) |
      | **Rigths**     | list only editable by administrators | entries can be created or modified by not administrators (depednding on parameters) |
      | **Extendable ?**|  Another lower level not possible| Possible to add another low lewel |
    - keep the list's name or the forms number jsut created
  2. create the high level :
    - create a new form called the _parent_ form
    - or create a list with all available values and another form whose role is to create links between the two levels
    - Comparison of two methods:
      
      | **Method**    | **list**               | **form**                                      |
      |:---------------|:------------------------|:----------------------------------------------------|
      | **Complexity** | Complex (3 steps : a list, a form for associations and entries) | Medium (2 steps : a form and the entries) |
      | **Rigths**     | list only editable by administrators, entries can be created or modified by not administrators (depednding on parameters)| entries can be created or modified by not administrators (depednding on parameters)|
    
    a. **method with form**
      1. create a new form called the _parent_ form
        - in this form, with field `bf_titre`, add a field of type `checkbox`, `radio`, `liste`, `checkboxfiche`, `radiofiche` or `listefiche`:
          - if the low level is a **list**, choose between `checkbox`, `radio` (radio button) or `liste` (select), then select the list corresponding to the low level
          - if the low level is a **form**, choose between `checkboxfiche` (checkboxr), `radiofiche` (radio button) or `listefiche` (select), then select the form corresponding to the low level
        - it is possible to choose the wanted display method for the association betwenne the two levels (`normal`, `by tags` or `drag and drop`)
        - the type of link is not important (`checkbox`, `radio` ou `liste`). Choose the most praticable for the goal. **Warning**, only the `checkbox` mode allows to association several low levels to an high level.
      2. Create an entry in the high level's form for each category of the high level
        - for each entry, select inthe field associated to the the low level the corresponding values.
        - a same low level can be associated to several high levels.
    
    b. **method with a list**
      1. create a new list called _parent_ list
         - add **ALL** possibles values for this leve
      2. create a form form association called _assocaiting_ form
         - this form **MUST** contain a field of type `checkbox`, `radio` or `liste` which is linked to the _parent_ list
         - this form **MUST** contain a field of type `checkbox`, `radio` or `liste` which is linked to the _low level_ list if the low level is a list
         - this form **MUST** contain a field of type `checkboxfiche`, `fiche` or `listefiche` which is linked to the _low level_ form if the low level is a form
         - check if a field `bf_titre` is present into the form
         - other fields are not important
      3. create all needed entry for _associating_ form to link _high level_ and _low level_

### Configuration of the form where the list with two levels will be used
    
 1. insert a field of type `checkboxfiche`, `radiofiche` or `listefiche` for the high level (the display method can be choose as wanted)
 2. select the form of high level for this field
 3. give a name to the field (for example, `bf_highlist` and keep it)
 4. add a field `enumlevel2` (2 levels list)
      - type the name of the high level field (parent field), (in the example `bf_highlist`)
      - select the wanted display method for this field paying attention that a display of list should be selected if the low level is a list (otherwise select a display of a form) 
      - the other parameters are the ones of `checkboxfiche`, `radiofiche` or `listefiche` fields
      - by example, select associated list to low level (or form is low level is a form)
      - **if high level is a list**, select the _associating_ form otherwise leave empty
 5. save the form

## Usage

When editing a list in the wanted form, a change of the value of the high level's field (checkbox, radio button, list), triggers the update of the low level's list according to the selected values for the high level.

Te filter system `facettes` also works.

**Tip** : In yeswiki action editor via `components` button, iit is possible to select the behaviour of filters in a group of filter between `or` (default) and `and`

To select this:
 - modify action `bazarliste`
 - check advanced parameters
 - search the parameter below `facettes` (filters)