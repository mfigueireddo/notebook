# AI Instructions - Personal Coding Habits

## Naming Conventions

### Method Names
- Use camelCase for all method names
- Examples: `getGamePanel()`, `updatePlayer()`, `renderGraphics()`

### Variable and Field Names
- Use snake_case for all variable and field names
- Examples: `game_panel`, `player_position`, `enemy_count`

### Constants
- Use UPPER_SNAKE_CASE for all constants (final static variables)
- Examples: `MAX_HEALTH`, `DEFAULT_SPEED`, `MIN_WIDTH`

### Descriptive Names
- Avoid abbreviations - use full, descriptive names
- Examples:
  - ✅ `enemy_health`, `maximum_velocity`
  - ❌ `en_hlth`, `max_vel`
- Avoid single-letter names, even in loops
- Examples:
  - ✅ `for (int row = 0; row < height; row++)`
  - ✅ `for (int index = 0; index < list.size(); index++)`
  - ✅ `for (int column = 0; column < width; column++)`
  - ❌ `for (int i = 0; i < n; i++)`

## Magic Numbers

- Never use magic numbers directly in code
- Always create final variables with descriptive names for all numeric values
- This includes: dimensions, sizes, margins, padding, thickness, colors, etc.
- Examples:
  - `final int buttons_width = 200;`
  - `final int buttons_height = 40;`
  - `final int buttons_vbox_border_thickness = 10;`
  - `final int buttons_vbox_margin = 10;`
- Group related constants together in the code for clarity

## Exception Handling

- Use exceptions ONLY for extreme cases when the program is at risk of improper behavior
- Exceptions should be reserved for situations that cannot be handled through normal control flow
- For expected conditions and validation, prefer explicit checks and error handling without exceptions

## General Programming Principles

### Memory Management and Performance

#### Recursion
- **Never use recursion**
- Prevents being stuck in infinite recursion and wasting memory

### Loop Safety

#### While Loop Iteration Limits
- **Always limit the number of iterations in while loops**
- This prevents the program from being stuck in an infinite loop if something goes wrong
- **Always create code to handle when this limitation is triggered**
- Example:
  ```cpp
  int max_iterations = 1000;
  int iteration_count = 0;
  while (condition && iteration_count < max_iterations) {
      // loop body
      iteration_count++;
  }
  if (iteration_count >= max_iterations) {
      // Handle loop limit reached
      logError("While loop exceeded maximum iterations");
  }
  ```

### Variable and Scope Management

#### Variable Scope
- **Limit variable access to the smallest scope possible**
- Makes the code easier to maintain
- Declare variables as close as possible to where they are used

#### Type Annotations (Dynamic Languages)
- **Always declare variable types in dynamically-typed languages**
- Even when the language does not require it, explicit types improve readability, catch bugs early, and serve as documentation
- Examples:
  - Python: use type hints (`x: int = 5`, `def process(name: str) -> bool:`)
  - JavaScript/TypeScript: use TypeScript annotations or JSDoc types
  - ✅ `player_health: int = 100`
  - ✅ `def getScore(player_id: int) -> float:`
  - ❌ `player_health = 100`
  - ❌ `def getScore(player_id):`

### Code Quality and Debugging

#### Debug Logging
- **Never commit code with debug logs**
- This includes functions like: `print()`, `printf()`, `console.log()`, `System.out.println()`, etc.
- **Exception**: This rule can be ignored if the project explicitly uses the terminal/console for communication with the user

### Compilation and Build Standards

#### Compiler Warnings
- **Always compile code with warnings activated**
- **Prefer compilation settings that treat warnings as errors**
- Examples:
  - C/C++: Use `-Wpedantic` and `-Werror`
  - Java: Use `-Xlint:all` and `-Werror`
- This ensures code quality and catches potential issues early

#### Code Formatting
- **Guarantee that indentation is uniform across all code**
- **Configure the IDE's TAB behavior to use 4 spaces**
- Maintain consistency across all files in the project

#### Macro Usage
- **Avoid using macros as conditions or flags**
- Macro flags exponentially increase the test cases necessary to cover the whole system's behavior
- Prefer const variables, enums, or configuration classes instead

#### Compile-Time Constants
- **Use language resources like `inline constexpr` when creating variables that have their value known at the beginning of the program and won't be modified**
- This is a great substitution for MACROS
- Provides type safety and better debugging compared to preprocessor macros
- Examples:
  - C++: `inline constexpr int file_path = "src/images/tree.png";`
  - C++: `inline constexpr double PI = 3.14159265359;`
- Benefits: type checking, scoping rules, and debugger visibility

### Object-Oriented Design

#### Parent Classes
- **When creating a parent class, make it abstract**
- This makes the code's behavior more explicit
- Forces intentional design decisions about which classes should be instantiated

#### Member Access
- **Always use `this.` when accessing any class member (fields, methods, properties)**
- Applies to all member accesses within a class, without exception
- Examples:
  - ✅ `this.player_health = 100;`
  - ✅ `this.updatePlayer();`
  - ❌ `player_health = 100;`
  - ❌ `updatePlayer();`

---

# AI Instructions - Code Documentation Model

When documenting functions, methods, or any callable unit of code, follow the structured model below. This ensures that every piece of logic is well-understood by both humans and AI assistants, reducing ambiguity and facilitating maintenance.

Not every item is mandatory for every function — use **only the items that are relevant**. For example, a simple getter with a self-explanatory name may only need **Description** and **Expected Returns**, while a complex business-logic method should include all seven items.

## Language of the Documentation Items

- **Always write the documentation item titles in Portuguese**, even though this instruction file describes them in English.
- The item names below are documented in English for reference only — when writing actual documentation in code, use the Portuguese titles:
  - Objective → **Objetivo**
  - Description → **Descrição**
  - Parameters → **Parâmetros**
  - Expected Returns → **Retornos esperados**
  - Assertives of Entrance → **Assertivas de entrada**
  - Assertives of Departure → **Assertivas de saída**
  - Restrictions → **Restrições**

## Documentation Items

### 1. Objective
- **When to include**: When the function's name alone does not fully convey all of its goals or side effects.
- **Purpose**: Clarify the broader intent behind the function — what it aims to achieve beyond what the name suggests.
- **Guideline**: If the function name is already fully descriptive (e.g., `getPlayerHealth()`), this item can be omitted. Include it when the function has secondary goals, orchestrates multiple operations, or its name is intentionally generic.

**Example:**
```
Objective: Initializes the game session by loading saved data, resetting the score,
and preparing the rendering pipeline for the first frame.
```

### 2. Description
- **When to include**: Always — this is the core of the documentation.
- **Purpose**: Explain **how** the function works internally, step by step.
- **Guideline**: Describe the logical flow, the sequence of operations, and any important decisions or branches the function takes. This should read as a walkthrough of the function's body without being a line-by-line code translation.

**Example:**
```
Description:
1. Reads the save file from disk using the FileManager utility.
2. Parses the JSON content into a PlayerData object.
3. If no save file exists, creates a default PlayerData with initial values.
4. Assigns the PlayerData to the active session and triggers a UI refresh.
```

### 3. Parameters
- **When to include**: When the function has parameters whose names do not fully explain their meaning, expected format, valid ranges, or role in the function's logic.
- **Purpose**: Remove all ambiguity about what should be passed in, including types, valid values, units, and edge cases.
- **Guideline**: If a parameter is named `player_name` and it clearly represents a player's name as a string, there is no need to document it. Focus on parameters that carry implicit expectations (e.g., a `speed` parameter that must be positive, or a `direction` parameter that only accepts specific values).

**Example:**
```
Parameters:
- tile_size: The size of each tile in pixels. Must be a positive integer and a power of 2
  (e.g., 16, 32, 64). Used to calculate the rendering grid dimensions.
- scale_factor: A multiplier applied to tile_size for high-DPI displays.
  A value of 1.0 means no scaling. Accepted range: 0.5 to 4.0.
```

### 4. Expected Returns
- **When to include**: When the function returns a value, especially if there are multiple return paths or the return value carries specific meaning.
- **Purpose**: Describe every possible return outcome and the conditions (streams) that lead to each one.
- **Guideline**: Document each distinct return path as a separate stream, clarifying what triggers it and what the caller should expect. For void methods, this item can be omitted or replaced with a note about side effects.

**Example:**
```
Expected Returns:
- Returns the loaded PlayerData object when the save file is successfully read and parsed.
- Returns a new PlayerData with default values when no save file is found on disk.
- Returns null when the save file exists but contains corrupted or unreadable data.
```

### 5. Assertives of Entrance (Preconditions)
- **When to include**: When the function depends on specific conditions being true **before** it is called — covering both parameter expectations and the overall system state.
- **Purpose**: Define the contract that callers must satisfy. If these conditions are not met, the function's behavior is undefined or unreliable.
- **Guideline**: Think about what the function takes for granted. Does it assume a file exists? That a connection is open? That a parameter is non-null? Document all such assumptions explicitly.

**Example:**
```
Assertives of Entrance:
- The GameEngine must be fully initialized (i.e., GameEngine.getInstance() returns a non-null value).
- The file_path parameter must point to an existing, readable file on disk.
- The player_id parameter must correspond to a player already registered in the active session.
```

### 6. Assertives of Departure (Postconditions)
- **When to include**: When the function modifies state, and the caller or the system relies on specific conditions being true **after** the function completes.
- **Purpose**: Define what the function guarantees upon successful completion — covering both output values and changes to system state.
- **Guideline**: Think about what has changed after this function runs. Has an object been mutated? Has a file been written? Has a flag been set? Document the guaranteed state of the world after execution.

**Example:**
```
Assertives of Departure:
- The active session's PlayerData is non-null and fully populated.
- The UI has been refreshed to reflect the loaded player data.
- If a new default PlayerData was created, it has NOT been persisted to disk yet —
  the caller is responsible for saving it if needed.
```

### 7. Restrictions
- **When to include**: When there are business rules, technical constraints, or design decisions that dictate **how** the function must operate, beyond its pure logic.
- **Purpose**: Make explicit any rules that constrain the implementation — such as data storage choices, performance requirements, external dependencies, or deliberate limitations.
- **Guideline**: This is the place for "why it's done this way" notes. If the function writes to a `.txt` file instead of a database, or must avoid using a certain library, or has a specific threading requirement, document it here.

**Example:**
```
Restrictions:
- Player data must be persisted in a local .txt file, not in a database,
  due to the project's offline-first requirement.
- This function must not be called from a background thread, as it directly
  updates Swing UI components which require the Event Dispatch Thread.
- The save file format must remain backward-compatible with version 1.0 saves.
```

## Quick Reference Template

```
/**
 * Objective: [Broader intent, if the name is not self-explanatory]
 *
 * Description:
 * 1. [Step one]
 * 2. [Step two]
 * 3. [Step three]
 *
 * Parameters:
 * - param_name: [Meaning, format, valid range, or special expectations]
 *
 * Expected Returns:
 * - Returns [value/type] when [condition].
 * - Returns [value/type] when [condition].
 *
 * Assertives of Entrance:
 * - [Precondition about parameters or system state]
 *
 * Assertives of Departure:
 * - [Postcondition about outputs or system state]
 *
 * Restrictions:
 * - [Business rule or technical constraint]
 */
```
