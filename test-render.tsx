import { DialogTrigger } from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import React from 'react';
function Test() {
  return <DialogTrigger render={<Button />} />;
}
