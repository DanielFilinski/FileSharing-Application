# Microsoft Teams Application Interface Requirements

## General Requirements

### Color Scheme
- Use official Microsoft Teams color palette
- Support light and dark themes
- Primary colors:
  - Primary: #0078d4
  - Secondary: #2b88d8
  - Success: #107c10
  - Warning: #ffb900
  - Error: #d13438

### Typography
- Use Segoe UI font
- Header sizes:
  - H1: 28px
  - H2: 24px
  - H3: 20px
  - H4: 18px
  - Body: 14px
  - Small: 12px

## Fluent UI Components

### Navigation
- Use `Nav` component for sidebar navigation
- Apply `CommandBar` for top toolbar
- Implement `Breadcrumb` for navigation chain

### Forms
- Use `TextField` for text fields
- Apply `Dropdown` for dropdown lists
- Implement `DatePicker` for date selection
- Use `Checkbox` and `Toggle` for switches

### Tables and Lists
- Apply `DetailsList` for tables
- Use `List` for simple lists
- Implement `Pagination` for page navigation

### Modal Windows
- Use `Dialog` for modal windows
- Apply `Panel` for side panels
- Implement `MessageBar` for notifications

### Buttons and Actions
- Use `PrimaryButton` for primary actions
- Apply `DefaultButton` for secondary actions
- Implement `IconButton` for icon actions

## Responsiveness
- Support resolutions from 320px to 1920px
- Use `Stack` for responsive layout
- Apply `ResponsiveLayout` for adaptive components

## Accessibility
- Ensure keyboard navigation support
- Add ARIA attributes
- Support high contrast
- Ensure screen reader support

## Animations
- Use standard Fluent UI animations
- Animation duration: 200-300ms
- Apply smooth transitions for state changes

## Icons
- Use `FluentIcons` from Fluent UI library
- Icon sizes:
  - Small: 16px
  - Medium: 20px
  - Large: 24px

## Component States
- Hover: opacity or color change
- Focus: clear outline
- Active: background color change
- Disabled: reduced opacity

## Spacing and Alignment
- Base spacing: 8px
- Use 8px grid for all spacing
- Left alignment for text
- Centering for buttons and actions

## Loading and Error Handling
- Use `Spinner` for loading indication
- Apply `MessageBar` for error display
- Implement `ProgressIndicator` for long operations