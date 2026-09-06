# Pixel Cat Loading Animation

## Feature Introduction
The customer page now includes a cute pixel-style silver gradient British Shorthair cat loading animation. You can preview this animation by clicking the test button.

## How to Use the Test Button

1. **Navigate to the Customer Page**
   - Click the "Customers" menu item in the sidebar
   - Or directly visit `http://localhost:5173/customers`

2. **Find the Test Button**
   - In the button group at the top of the page, find the purple "Test Animation" button
   - The button icon is a play icon

3. **Trigger the Animation**
   - Click the "Test Animation" button
   - The entire page will display a cute pixel cat sleeping animation
   - The animation automatically disappears after 5 seconds, or click "Skip Animation" to end early

## Animation Features
- **Pixel Style**: Retro 8-bit pixel art style
- **Silver Gradient**: British Shorthair's signature silver-gray gradient fur
- **Sleep Effect**: Floating Z letters and snoring bubbles
- **Responsive Design**: Adapts to various screen sizes

## Technical Implementation
- **Component**: `PixelCatLoader.tsx`
- **Styling**: CSS animations with pixel-perfect rendering
- **State Management**: React useState controls show/hide
- **Auto Close**: 5-second timer automatically ends animation

## Use Cases
Besides the test button, this animation also automatically displays in the following situations:
- When loading customer data
- During search/filter operations
- When infinite scroll loads more data

Enjoy the delightful loading experience brought by this cute pixel cat!

