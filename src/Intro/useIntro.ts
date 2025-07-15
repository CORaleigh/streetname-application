import { useState } from "react";

const useIntro = () => {
    const [visibleDialog, setVisibleDialog] = useState<'rules' | 'types' | undefined>(undefined);
    const showDialogClicked = (dialog: 'rules' | 'types' | undefined) => {
        setVisibleDialog(dialog);
    }
  return {
    visibleDialog,
    setVisibleDialog,
    showDialogClicked
  };
};

export default useIntro;
