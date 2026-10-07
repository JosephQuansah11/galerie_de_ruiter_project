import React, {  useState } from "react";
import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { AntiqueForm } from "../../models/antiques/Antique";
import { AddAntiqueItem } from "../../hooks/useAddAntiques";
import { FormBaseEntity } from "../../types/types";
import { useTranslation } from "react-i18next";

interface AddFormProps<T extends FormBaseEntity> {
    items: T;
    onSubmit?: (data: T) => void | Promise<void>;
    buttonName?: string;
}


export function AddForm<T extends FormBaseEntity>({ items, onSubmit, buttonName }: Readonly<AddFormProps<T>>) {
    const { t } = useTranslation();
    const [validated, setValidated] = useState(false);
    const [submissionError, setSubmissionError] = useState<string>();

    // Generic function to build form data object from FormData
    const buildFormObject = (formData: FormData, template: T): T => {
        const result = {} as T;

        const processObject = (obj: any, target: any, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                const value = obj[key];

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Handle nested objects
                    target[key] = {};
                    processObject(value, target[key], fullKey);
                } else {
                    // Handle primitive values - try nested key first, then flat key
                    const formValue = formData.get(fullKey) || formData.get(key);
                    target[key] = formValue as string;
                }
            });
        };

        processObject(template, result);
        return result;
    };



    // Generate form fields recursively
    const generateFormFields = (obj: any, prefix = ''): React.ReactElement[] => {
        const fields: React.ReactElement[] = [];

        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                fields.push(
                    <h6 key={`header-${fullKey}`} className="mt-3 mb-2 text-capitalize">
                        {t(key, { defaultValue: key.replace(/([A-Z])/g, ' $1').trim() })}
                    </h6>
                , ...generateFormFields(value, fullKey));
            } else {
                fields.push(
                    <Form.Group controlId={`formBasic${fullKey}`} key={fullKey} className="mb-3">
                        <Form.Label className="text-capitalize">
                            {t(key, { defaultValue: key.replace(/([A-Z])/g, ' $1').trim() })}
                        </Form.Label>
                        <Form.Control
                            required
                            type="text"
                            name={fullKey}
                            defaultValue={value}
                            placeholder={t("enterField", { field: t(key, { defaultValue: key.replace(/([A-Z])/g, ' $1').trim() }) })}
                        />
                    </Form.Group>
                );
            }
        });

        return fields;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }

        setValidated(true);
        setSubmissionError(undefined);

        // Build the form object generically based on the template
        const formObject = buildFormObject(formData, items);

        if (form.checkValidity()) {
            try {
                if (onSubmit) {
                    await onSubmit(formObject);
                } else if ('name' in formObject && 'email' in formObject) {
                    await AddAntiqueItem(formObject as unknown as AntiqueForm);
                } else {
                    setSubmissionError('formCouldNotSubmit');
                }
            } catch {
                setSubmissionError('formCouldNotSave');
            }
        }
    };

    return (
        <div className="ms-2">
            <Form action="" noValidate validated={validated} method="post" onSubmit={handleSubmit} style={{ width: '100%' }}>
                {submissionError && <div className="alert alert-danger" role="alert">{t(submissionError)}</div>}
                {generateFormFields(items)}
                <Button as="button" type="submit" style={{ width: '100%' }} className="btn btn-primary mt-3">{buttonName}</Button>
            </Form>
        </div>
    )
}
