'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, TextField, RadioGroup, FormControlLabel, Radio, Stepper, Step, StepLabel, Box, Typography } from '@mui/material';
import schema from '../../schema.json'; // Path to schema.json in frontend root

// Function to create Zod schema dynamically from JSON
const getZodSchema = (fields: any[]) => {
  const shape: Record<string, any> = {};
  fields.forEach((field) => {
    let validator = z.string();
    if (field.validations?.required) validator = validator.min(1, 'Required');
    if (field.validations?.maxlength) validator = validator.max(field.validations.maxlength);
    if (field.validations?.pattern) validator = validator.regex(new RegExp(field.validations.pattern), 'Invalid format');
    shape[field.name] = validator.optional(); // Optional for multi-step form
  });
  return z.object(shape);
};

// Step labels for the progress tracker
const steps = ['Step 1: Aadhaar Validation', 'Step 2: PAN Validation'];

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStepKey = activeStep === 0 ? 'step1' : 'step2';
  const currentSchema = schema.steps[currentStepKey];
  const formSchema = getZodSchema(currentSchema.fields);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    if (activeStep === steps.length - 1) {
      // Submit to backend
      try {
        const response = await fetch('https://udyam-backend.up.railway.app/api/submit', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          alert('Form submitted successfully!');
        } else {
          alert('Submission failed. Check backend logs.');
        }
      } catch (error: unknown) {
        // Type assertion for error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert('Error submitting form: ' + errorMessage);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const renderField = (field: any) => {
    if (field.type === 'radio') {
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: controllerField }) => (
            <RadioGroup {...controllerField} onChange={(e) => controllerField.onChange(e.target.value)}>
              {field.options.map((opt: string) => (
                <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
              ))}
            </RadioGroup>
          )}
        />
      );
    }
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: controllerField }) => (
          <TextField
            {...controllerField}
            label={field.label}
            placeholder={field.placeholder}
            error={!!errors[field.name]}
            helperText={(errors[field.name]?.message as string) || ''}
            fullWidth
            margin="normal"
            inputProps={{ maxLength: field.validations?.maxlength }}
          />
        )}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Udyam Registration Form
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6" gutterBottom>
          {currentSchema.description}
        </Typography>
        {currentSchema.fields.map((field: any) => (
          <div key={field.name}>{renderField(field)}</div>
        ))}
        <Box sx={{ mt: 2 }}>
          {currentSchema.buttons.map((btn: any) => (
            <Button
              key={btn.text}
              type={btn.action.includes('validate') ? 'submit' : 'button'}
              variant="contained"
              sx={{ mr: 1 }}
              onClick={btn.action === 'sendOTP' ? () => alert('OTP requested (mock)') : undefined}
            >
              {btn.text}
            </Button>
          ))}
        </Box>
      </form>
    </Box>
  );
}