import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

const ActionsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // 1. Add state to store the selected action's label. Default to 'Actions'.
  const [selectedAction, setSelectedAction] = useState('Actions');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // This handles closing the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // An array of available actions
  const actions = ['Waypoint Mark', 'Continuous Line', 'Center Line'];

  const handleActionClick = (actionName: string) => {
    // 2. Update the state with the name of the clicked action
    setSelectedAction(actionName);
    // 3. Close the dropdown
    setIsOpen(false);
    // Here you would also trigger the actual function for the action,
    // e.g., by calling a prop like onClear() or onSave()
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex w-full items-center justify-between gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        {/* 4. Display the state variable as the button's label */}
        <span>{selectedAction}</span>
        <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <ul className="py-1">
            {actions.map((action) => (
              <li key={action}>
                {/* 5. Handle the click event for each action item */}
                <button
                  onClick={() => handleActionClick(action)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {action}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;
