import React, { createContext, useContext } from 'react';

interface StudentMenuContextValue {
  openMenu: () => void;
}

const StudentMenuContext = createContext<StudentMenuContextValue>({ openMenu: () => {} });

export function StudentMenuProvider({
  children,
  openMenu,
}: {
  children: React.ReactNode;
  openMenu: () => void;
}) {
  return (
    <StudentMenuContext.Provider value={{ openMenu }}>
      {children}
    </StudentMenuContext.Provider>
  );
}

export function useStudentMenu() {
  return useContext(StudentMenuContext);
}
