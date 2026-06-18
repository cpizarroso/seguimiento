import { Modal } from './Modal';
import { Button } from './Button';

interface AlertDialogProps {
    open: boolean;
    onClose: () => void;
    icon?: string;
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function AlertDialog({ open, onClose, icon, title, description, children }: AlertDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                        {children}
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
}
