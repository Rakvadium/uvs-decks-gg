```yaml
- region "Notifications alt+T"
- dialog "Edit deck details":
  - heading "Edit deck details" [level=2]
  - paragraph: Change the name, description, play format, visibility, and who can view this deck.
  - text: Deck name
  - textbox "Deck name": Radiant Tempo
  - text: Description
  - textbox "Description":
    - /placeholder: Add a short description
    - text: Seeded public deck for validation captures.
  - text: Format
  - combobox "Format": Standard
  - text: Visibility
  - combobox "Visibility": Public
  - button "Delete deck"
  - button "Cancel"
  - button "Save"
  - button "Close"
```
