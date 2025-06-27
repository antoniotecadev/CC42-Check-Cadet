import { EventUser } from "@/repository/eventRepository";

// Função utilitária para gerar o HTML do PDF
export function generateAttendanceHtml({
    title,
    logoBase64,
    eventName,
    eventDate,
    presents = 0,
    absents = 0,
    subscribed = 0,
    unsubscribed = 0,
    usersWithPresence,
}: {
    title: "Lista de Presença" | "Lista de Assinaturas";
    logoBase64: string;
    eventName: string;
    eventDate: string;
    presents?: number;
    absents?: number;
    subscribed?: number;
    unsubscribed?: number;
    usersWithPresence: EventUser[];
}) {
    // Divide os usuários em páginas de 28 linhas
    const pageSize = 28;
    const pages = [];
    for (let i = 0; i < usersWithPresence.length; i += pageSize) {
        pages.push(usersWithPresence.slice(i, i + pageSize));
    }
    return `
        <html>
        <head>
            <style>
                @page { size: A4; }
                body { font-family: Arial, sans-serif; margin: 24px; margin-bottom: 60px; }
                .header { text-align: center; margin-bottom: 16px; }
                .logo { width: 80px; height: 40px; margin-bottom: 8px; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
                .subtitle { font-size: 14px; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { border: 1px solid #ccc; padding: 6px 4px; font-size: 12px; text-align: left; }
                th { background: #f0f0f0; }
                .present { color: #2ecc40; font-weight: bold; }
                .absent { color: #e74c3c; font-weight: bold; }
                .footer { width: 100%; margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
                .page-break { page-break-after: always; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoBase64}" class="logo" />
                <div class="title">${title}</div>
                <div class="subtitle">${
                    title === "Lista de Assinaturas"
                        ? `Assinado: ${subscribed} | Não Assinado: ${unsubscribed}`
                        : `Presente: ${presents} | Ausente: ${absents}`
                }</div>
                <div class="subtitle">${eventName || ""} - ${
        eventDate || ""
    }</div>
            </div>
            <table>
                <tr>
                    <th>#</th>
                    <th>Nome Completo</th>
                    <th>Login</th>
                    <th>${
                        title === "Lista de Assinaturas"
                            ? "Assinatura"
                            : "Presença"
                    }</th>
                </tr>
                ${pages[0]
                    .map(
                        (u, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${u.displayname}</td>
                        <td>${u.login}</td>
                        ${
                            title === "Lista de Assinaturas"
                                ? `<td class="${
                                      u.isSubscribed ? "present" : "absent"
                                  }">${
                                      u.isSubscribed
                                          ? "Assinado"
                                          : "Não Assinado"
                                  }</td>`
                                : `<td class="${
                                      u.isPresent ? "present" : "absent"
                                  }">${
                                      u.isPresent ? "Presente" : "Ausente"
                                  }</td>`
                        }
                    </tr>
                `
                    )
                    .join("")}
            </table>
            <div class="footer">Lista de presença gerada em ${new Date().toLocaleString()}</div>
            ${pages
                .slice(1)
                .map(
                    (page, pageIndex) => `
                <table>
                    <tr>
                        <th>#</th>
                        <th>Nome Completo</th>
                        <th>Login</th>
                        <th>${
                            title === "Lista de Presença"
                                ? "Presença"
                                : "Assinatura"
                        }</th>
                    </tr>
                    ${page
                        .map(
                            (u, i) => `
                        <tr>
                            <td>${(pageIndex + 1) * pageSize + i + 1}</td>
                            <td>${u.displayname}</td>
                            <td>${u.login}</td>
                           ${
                               title === "Lista de Assinaturas"
                                   ? `<td class="${
                                         u.isSubscribed ? "present" : "absent"
                                     }">${
                                         u.isSubscribed
                                             ? "Assinado"
                                             : "Não Assinado"
                                     }</td>`
                                   : `<td class="${
                                         u.isPresent ? "present" : "absent"
                                     }">${
                                         u.isPresent ? "Presente" : "Ausente"
                                     }</td>`
                           }
                        </tr>
                    `
                        )
                        .join("")}
                </table>
                <div class="footer">${title} gerada em ${new Date().toLocaleString()}</div>
                ${
                    pageIndex < pages.length - 2
                        ? '<div class="page-break"></div>'
                        : ""
                }
            `
                )
                .join("")}
        </body>
        </html>
        `;
}
