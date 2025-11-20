"use client";

import { FileText, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EvidencePage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Центр доказательств</h1>
                <p className="text-muted-foreground">Сбор и хранение evidence для защиты от чарджбэков</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Evidence Center</CardTitle>
                    <CardDescription>Система сбора доказательств</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">Функционал в разработке</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                        Загрузка документов, трекинг доставок, подписи получателей, скриншоты переписок
                    </p>
                    <Button className="gap-2" disabled>
                        <Upload className="h-4 w-4" />
                        Загрузить доказательство
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
