export async function generateTeamPDF(team: any, players: any[]) {
  const { jsPDF } = await import('jspdf')
  // @ts-ignore
  await import('jspdf-autotable')
  const doc = new jsPDF()

  // Orange header bar
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, 210, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('PlayerAuctionHub', 14, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('playerauctionhub.in  |  Local Cricket Auction', 14, 22)
  doc.text('Made by Kunal Kotak (@kunallll2303) & Yash Jani (@yash_jani_)', 14, 30)

  // Team block
  doc.setFillColor(28, 25, 23)
  doc.rect(0, 38, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(team.teamName, 14, 50)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Owner: ${team.ownerName}   |   Players: ${players.length}   |   Total Points: ${players.reduce((s:number,p:any) => s+(p.soldPoints||0),0)}`, 14, 58)

  // Table
  doc.setTextColor(0,0,0)
  // @ts-ignore
  doc.autoTable({
    startY: 68,
    head: [['#','Player Name','Role','Village/City','Points Paid']],
    body: players.map((p,i) => [i+1, p.name, p.role, p.village||'—', `${p.soldPoints||0} pts`]),
    styles: { fontSize: 10, cellPadding: 3.5 },
    headStyles: { fillColor:[249,115,22], textColor:255, fontStyle:'bold' },
    alternateRowStyles: { fillColor:[255,247,237] },
    columnStyles: { 0:{cellWidth:10}, 1:{cellWidth:55}, 2:{cellWidth:35}, 3:{cellWidth:45}, 4:{cellWidth:35} }
  })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  // @ts-ignore
  const finalY = doc.lastAutoTable?.finalY || 150
  doc.text('© PlayerAuctionHub | Built by Kunal Kotak (@kunallll2303) & Yash Jani (@yash_jani_)', 105, Math.min(finalY+15, 285), { align:'center' })

  doc.save(`${team.teamName.replace(/\s+/g,'_')}_squad.pdf`)
}

export async function generateAllPDFs(teams: any[], allPlayers: any[], settings: any) {
  let generated = 0
  for (const team of teams) {
    const squad = allPlayers.filter((p:any) => p.soldTo === team.id)
    if (squad.length > 0) {
      await generateTeamPDF(team, squad)
      generated++
      await new Promise(r => setTimeout(r, 700))
    }
  }
  if (generated === 0) {
    const { default: toast } = await import('react-hot-toast')
    toast.error('No players sold yet — no PDFs to generate')
  }
}
