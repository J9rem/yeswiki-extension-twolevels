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
      | **Complexoty** | Simple (only a list) | Complex (2 steps : a form the entries) |
      | **Rigths**     | list only editable by administrators | entries can be created or modified by not administrators (depednding on parameters) |
      | **Extendable ?**|  Another lower level not possible| Possible to add another low lewel |
    - keep the list's name or the forms number jsut created
  2. create the high level :
    - create a new form called the _parent_ form
    - in this form, with field `bf_titre`, add a field of type `checkbox`, `radio`, `liste`, `checkboxfiche`, `radiofiche` or `listefiche`:
       - if the low level is a **list**, choose between `checkbox`, `radio` (radio button) or `liste` (select), then select the list corresponding to the low level
       - if the low level is a **form**, choose between `checkboxfiche` (checkboxr), `radiofiche` (radio button) or `listefiche` (select), then select the form corresponding to the low level
    - it is possible to choose the wanted display method for the association betwenne the two levels (`normal`, `by tags` or `drag and drop`)
    - the type of link is not important (`checkbox`, `radio` ou `liste`). Choose the most praticable for the goal. **Warning**, only the `checkbox` mode allows to association several low levels to an high level.
  3. Create an entry in the high level's form for each category of the high level
    - for each entry, select inthe field associated to the the low level the corresponding values.
    - a same low level can be associated to several high levels.

### Configuration of the form where the list with two levels will be used
    
 1. insert a field of type `checkboxfiche`, `radiofiche` or `listefiche` for the high level (the display method can be choose as wanted)
 2. select the form of high level for this field
 3. give a name to the field (for example, `bf_highlist` and keep it)
 4. add a field `enumlevel2` (2 levels list)
      - type the name of the high level field (parent field), (ni the example `bf_highlist`)
      - to speed up the display of data, select also the associated form
      - select the wanted display method for this field paying attention that a display of list should be selected if the low level is a list (otherwise select a display of a form) 
      - the other parameters are the ones of `checkboxfiche`, `radiofiche` or `listefiche` fields
 5. save the form

## Usage

When editing a list in the wanted form, a change of the value of the high level's field (checkbox, radio button, list), triggers the update of the low level's list according to the selected values for the high level.

Te filter system `facettes` also works.

**Tip** : In yeswiki action editor via `components` button, iit is possible to select the behaviour of filters in a group of filter between `or` (default) and `and`

To select this:
 - modify action `bazarliste`
 - check advanced parameters
 - search the parameter below `facettes` (filters)