import { createContext, useContext, useEffect, useState } from 'react';

// Create a Context to store the title state
const PageTitleContext = createContext({
  title: 'QRFit',
  setTitle: (title: string) => {},
});

// Hook to use the PageTitle Context
export const usePageTitle = () => useContext(PageTitleContext);

// PageTitleProvider component to wrap the app
export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [title, setTitle] = useState('QRFit');

  useEffect(() => {
    document.title = title; // Updates the browser title
  }, [title]);

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};
