# jsg-core

The JSG Core module manages the Graph Model. 
The Graph Model represents the logical model of the Graph. A graph consists
 typically of a set of GraphItems, which contain all attributes necessary to define
 the positioning, behaviour and format of a GraphItem. GraphItems also act as
 containers to group child items. There are several implementations of a GraphItem within
 the component to provide e.g. Nodes, Edges, Groups or TextNodes.
 
 In addition the module provide a set of generic classes to provide geometric operations, 
 persistence and other commons tasks.
 
 There is a complete set of commands to alter the Graph Model available. Using
 these command, the API provides all necessary manipulations of the Graph and 
 its GraphItems. Examples for the operations would be moving, deleting, rotating or
 formattings an item. The command logic is also used to provide undo/redo capabilities.
 
The module contains some layout and arrangement logic to organize items within
a container.